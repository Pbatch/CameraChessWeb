import type { Position } from "chessops/chess";
import type { MovesPair } from "../types";
import { EMPTY, NUM_LABELS, pieceToLabel } from "../utils/constants";

// The game as the tracker sees it: the position it looks for moves from, and the moves and replies from there.
// movesPairs must be a new array for each new position, as that is how the tracker knows the game has moved on: it
// starts again whenever the array changes, and after playing a move for good it waits for a new one.
export interface TrackerGame {
  movesPairs: MovesPair[],
  position: Position
}

// A move to play. A greedy move is shown provisionally, until its reply confirms it, and a different move may still
// replace it.
export interface TrackerMove {
  san: string,
  greedy: boolean
}

export interface BayesianOptions {
  // Whether a move is shown provisionally until its reply confirms it. Without, a move is played for good on its own
  // share, as play mode needs, since its moves go to Lichess straight away.
  provisional: boolean,
  // Chance that the game moves on by one more move, per REFERENCE_INTERVAL. Like evidenceWeight, it is scaled to the
  // time between frames, so the tracker behaves the same however many frames a second the device manages.
  moveChance: number,
  // Temperature for the model's probabilities: each square's become softmax(log p / temperature), as the model is
  // overconfident
  temperature: number,
  // Share of each square's probability spread evenly over all labels, so a hand over one square can't rule out a move
  floor: number,
  // Power each frame's evidence is raised to, per REFERENCE_INTERVAL: below 1 at 4 frames a second, as consecutive
  // frames are not independent. A frame twice as far from the last counts twice as much.
  evidenceWeight: number,
  // How sure the tracker must be of a move before showing it, and of a move with a reply before playing it for good.
  // Above 0.5, so only one move can pass it at a time.
  threshold: number
}

// From a sweep over 44 recorded blitz games (dev/replay.mjs), on the 43 without takebacks: 210 edits to fix, 88.5% of
// moves right before each game's first mistake and a median delay of 0.1s, against 271, 83% and 0.2s at the earlier
// evidenceWeight 0.6. evidenceWeight is what matters: 0.4 needed 394 edits, 0.6 271, 0.8 212, 1.0 238. Lower, moves
// are confirmed too slowly, and a third move often comes before the reply confirms the first. temperature is the
// model's calibration, measured on held-out data elsewhere (1.4 to 2.2 did about as well; 1 was worse). floor,
// moveChance and threshold barely matter (210 to 231 edits; threshold 0.98 was worse).
// Evidence doesn't fade, so a move shown for a while and then taken back needs about as long again to unwind. Moving a
// little share back to no move each frame (1e-8) fixed that, but cost more edits.
// Scaled to the time between frames, at 2 frames a second 24 of the games needed 174 edits and at 1, 408 (at
// evidenceWeight 0.6); with the same values per frame instead, 525 and 1354.
export const DEFAULT_BAYESIAN_OPTIONS: BayesianOptions = {
  provisional: true, moveChance: 0.01, temperature: 1.78, floor: 0.05, evidenceWeight: 0.8, threshold: 0.95
};

// The time between frames, in ms, that moveChance and evidenceWeight are given for: the app's 4 frames a second
const REFERENCE_INTERVAL = 250;
// The most a frame counts for, in ms, so one frame after a stall can't carry seconds of evidence
const MAX_INTERVAL = 1000;

// One way the game may have gone on since the last move played: a move, or a move and its reply
interface Hypothesis {
  // Its first move, as an index into the tracker's firsts
  first: number,
  // The reply, for a pair
  second: string | null,
  // For a pair, the index of the hypothesis of its first move alone
  parent: number,
  // The squares it changes, and the label each ends with
  squares: number[],
  labels: number[]
}

// Decides which move each frame's probabilities show by keeping a probability for every way the game may have gone
// on since the last move played: no move, any legal move, or any move and reply. Each frame shifts a little of it
// along to the next move, then weighs each way by how well it explains the frame. Once a move's share (alone or with
// any reply) passes the threshold it is shown provisionally, as a greedy move, and once its share with a reply does,
// it is played for good and the tracker looks on from there. Until then a different move can replace it, such as when
// a piece is put down and picked up again. A move whose destination the frames don't show stays split with the other
// moves of the same piece, so it is not shown on a guess.
export class BayesianTracker {
  readonly #options: BayesianOptions;
  #movesPairs: MovesPair[] | null = null;
  #hypotheses: Hypothesis[] = [];
  // The label on each square in the position the hypotheses start from
  #root: number[] = [];
  // Each first move, and how many single moves and replies there are, worked out once per position
  #firsts: string[] = [];
  #replies = new Int32Array(0);
  // The share of no move, and of each way. Each frame's shares are worked out in #next, then the two are swapped.
  #none = 1;
  #belief = new Float64Array(0);
  #next = new Float64Array(0);
  // Each frame's log-probability of each label on each square, and each way's evidence
  #logs = new Float64Array(64 * NUM_LABELS);
  #evidence = new Float64Array(0);
  // The move just played for good, until the game moves on to the position after it
  #played: string | null = null;
  // The move shown provisionally, if any
  #shown: string | null = null;
  // When the last frame came, in ms
  #lastTime: number | null = null;

  constructor(options: Partial<BayesianOptions> = {}) {
    this.#options = { ...DEFAULT_BAYESIAN_OPTIONS, ...options };
  }

  get started(): boolean {
    return this.#movesPairs !== null;
  }

  reset() {
    this.#lastTime = null;
    this.#movesPairs = null;
    this.#played = null;
    this.#shown = null;
  }

  // `update` is a 64x13 state in square order for one frame, unsmoothed, and `now` the frame's time in ms
  update(update: number[][], now: number, game: TrackerGame): TrackerMove | null {
    // The first frame counts as one at the usual rate
    const interval = (this.#lastTime === null) ? REFERENCE_INTERVAL
      : Math.min(Math.max(now - this.#lastTime, 0), MAX_INTERVAL);
    this.#lastTime = now;
    if (game.movesPairs !== this.#movesPairs) {
      this.#start(game);
    } else if (this.#played !== null) {
      // The app has not moved on from the move just played yet
      return null;
    }
    const hypotheses = this.#hypotheses;
    const n = hypotheses.length;
    if (n === 0) {
      return null;
    }
    const { provisional, temperature, floor, threshold } = this.#options;
    // The settings for the time since the last frame
    const steps = interval / REFERENCE_INTERVAL;
    const moveChance = (steps === 1) ? this.#options.moveChance : 1 - (1 - this.#options.moveChance) ** steps;
    const evidenceWeight = this.#options.evidenceWeight * steps;
    const belief = this.#belief;

    // A little of each way's share moves on to the next move
    const next = this.#next;
    for (let i = 0; i < n; i++) {
      const h = hypotheses[i];
      if (h.second === null) {
        const onward = (this.#replies[i] > 0) ? moveChance : 0;
        next[i] = belief[i] * (1 - onward) + this.#none * moveChance / this.#firsts.length;
      } else {
        next[i] = belief[i] + belief[h.parent] * moveChance / this.#replies[h.parent];
      }
    }
    let none = this.#none * (1 - moveChance);

    // Each way weighed by how well it explains the frame, against the position not changing. Each square's
    // probabilities are softened by the temperature, then mixed with the floor.
    const logs = this.#logs;
    for (let square = 0; square < 64; square++) {
      const row = square * NUM_LABELS;
      let sum = 0;
      for (let label = 0; label < NUM_LABELS; label++) {
        logs[row + label] = Math.max(update[square][label], 1e-30) ** (1 / temperature);
        sum += logs[row + label];
      }
      for (let label = 0; label < NUM_LABELS; label++) {
        logs[row + label] = Math.log((1 - floor) * logs[row + label] / sum + floor / NUM_LABELS);
      }
    }
    const evidence = this.#evidence;
    let top = 0;
    for (let i = 0; i < n; i++) {
      const { squares, labels } = hypotheses[i];
      let sum = 0;
      for (let k = 0; k < squares.length; k++) {
        const square = squares[k];
        sum += logs[square * NUM_LABELS + labels[k]] - logs[square * NUM_LABELS + this.#root[square]];
      }
      evidence[i] = evidenceWeight * sum;
      if (evidence[i] > top) top = evidence[i];
    }
    let total = none * Math.exp(-top);
    for (let i = 0; i < n; i++) {
      next[i] *= Math.exp(evidence[i] - top);
      total += next[i];
    }
    none = none * Math.exp(-top) / total;
    for (let i = 0; i < n; i++) {
      next[i] /= total;
    }
    this.#none = none;
    this.#belief = next;
    this.#next = belief;

    // Each first move's share in all, and with a reply. The threshold is above 0.5, so only the largest can pass it.
    const shares = new Float64Array(this.#firsts.length);
    const replied = new Float64Array(this.#firsts.length);
    for (let i = 0; i < n; i++) {
      shares[hypotheses[i].first] += next[i];
      if (hypotheses[i].second !== null) {
        replied[hypotheses[i].first] += next[i];
      }
    }
    const confirmed = provisional ? replied : shares;
    const best = largest(confirmed);
    if (confirmed[best] > threshold) {
      this.#played = this.#firsts[best];
      this.#shown = null;
      return { san: this.#played, greedy: false };
    }
    const shown = largest(shares);
    if (provisional && shares[shown] > threshold && this.#firsts[shown] !== this.#shown) {
      this.#shown = this.#firsts[shown];
      return { san: this.#shown, greedy: true };
    }
    return null;
  }

  // The hypotheses from a new position. After a move this tracker played, its pairs carry their share over as the
  // reply alone, and the move itself as no move; otherwise the game starts from no move.
  #start(game: TrackerGame) {
    const played = this.#played;
    const old = this.#hypotheses;
    const oldFirsts = this.#firsts;
    const oldBelief = this.#belief;
    this.#movesPairs = game.movesPairs;
    this.#played = null;
    this.#shown = null;
    this.#root = Array.from({ length: 64 }, (_, square) => {
      const piece = game.position.board.get(square);
      return (piece === undefined) ? EMPTY : pieceToLabel(piece);
    });

    const hypotheses: Hypothesis[] = [];
    const firsts: string[] = [];
    // The hypothesis of each first move alone
    const singles = new Map<string, number>();
    for (const pair of game.movesPairs) {
      const san = pair.move1.sans[0];
      if (!singles.has(san)) {
        singles.set(san, hypotheses.length);
        hypotheses.push({ first: firsts.length, second: null, parent: -1, squares: [...pair.move1.from, ...pair.move1.to],
          labels: [...pair.move1.from.map(() => EMPTY), ...pair.move1.targets] });
        firsts.push(san);
      }
      if (pair.move2 !== null && pair.moves !== null) {
        const parent = singles.get(san) ?? -1;
        hypotheses.push({ first: hypotheses[parent].first, second: pair.move2.sans[0], parent,
          squares: [...pair.moves.from, ...pair.moves.to], labels: [...pair.moves.from.map(() => EMPTY), ...pair.moves.targets] });
      }
    }
    this.#hypotheses = hypotheses;
    this.#firsts = firsts;
    this.#replies = new Int32Array(hypotheses.length);
    for (const h of hypotheses) {
      if (h.second !== null) this.#replies[h.parent] += 1;
    }
    this.#belief = new Float64Array(hypotheses.length);
    this.#next = new Float64Array(hypotheses.length);
    this.#evidence = new Float64Array(hypotheses.length);
    this.#none = 1;
    if (played === null) {
      return;
    }
    let none = 0;
    old.forEach((h, i) => {
      if (oldFirsts[h.first] !== played) return;
      if (h.second === null) {
        none += oldBelief[i];
      } else {
        const single = singles.get(h.second);
        if (single !== undefined) this.#belief[single] += oldBelief[i];
      }
    });
    const total = none + this.#belief.reduce((a, b) => a + b, 0);
    if (total > 0) {
      this.#none = none / total;
      for (let i = 0; i < this.#belief.length; i++) {
        this.#belief[i] /= total;
      }
    }
  }
}

// The index of the largest value
const largest = (values: Float64Array): number => {
  let best = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[best]) best = i;
  }
  return best;
}
