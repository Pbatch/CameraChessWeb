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
  threshold: number,
  // Chance that the model read a frame with the board turned half way round, as it sometimes does in endgames, when
  // where the pieces stand no longer shows which side is White. Each way is weighed by how well it explains the frame
  // either way round, so a frame read turned round counts for the right squares instead of looking like every piece
  // moved. 0 reads every frame as it comes.
  flipChance: number
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
// flipChance took the 210 edits to 184 (89.2% right before the first mistake), changing only the four games whose
// endgames had frames read turned round: 0.001 needed 186 edits, 0.01 190, 0.05 and 0.2 184.
// The numbers above are for the earlier model. The current one (chessq-chesscam-dinov3-448-v2) needs 158 edits (90.7%)
// at temperature 3.5 and evidenceWeight 1.4, against 166 at the earlier 1.78 and 0.8. It does about as well wherever
// evidenceWeight is 0.35 to 0.4 times the temperature, from 2.5 up; 5 and 2 needed 171.
// The next model (chessq-chesscam-dinov3-448-v3) fits temperature 1.8 by NLL on the benchmark frames (v2: 1.9). On
// 48 benchmark games with the beam (edits capped at 10 a game, KxBH left out, in two alternating halves), 1.8 and 1.08
// need 29 (14 + 15; 102 uncapped, 92.0% right before the first mistake), against v2's best of 32 (16 + 16; 113) at 3.5
// and 1.4. It does about as well wherever evidenceWeight is 0.5 to 0.6 times the temperature, from 1.8 up (27 to 30);
// at 0.4 times it needs 33 to 35, at 0.3 times 36 to 51, and temperature 1.5 needs 40 or more.
// The current model (chessq-chesscam-dinov3-448-v4, trained on twice the YunkerChess frames) fits temperature 1.75 by
// NLL. With the tracker as it now is, on the same games and count (42 games), 3.0 and 1.5 need 16 (12 + 4; 27
// uncapped; 41 of 47 games perfect, 92.3%), against v3's 20 (12 + 8; 21) at its 1.8 and 1.08 and its best of 18. It
// does as well (16) wherever evidenceWeight is 0.4 to 0.6 times the temperature, from 2.2 up, and at 0.4 to 0.5 times
// from 1.5; at 0.6 times below 2.2 it needs 26, and at 0.7 times 13 to 26 with 56 to 67 uncapped. Against v3 it
// reads a promoted queen v3 took for a rook (dL6Q 7 to 0), but gets LEYx's swapped move order worse (11 to 20).
// The current model (chessq-chesscam-dinov3-320-v4) is v4 fine-tuned at 320 x 320, which runs twice as fast (Pixel 7a:
// 383 ms against 788 on the CPU, 196 against 416 on WebGPU). It gets 16% more squares wrong (1.07% against 0.92%), but
// at 3.0 and 1.5 needs 18 (11 + 7; 38 uncapped, 38 of 42 perfect), and no other setting did better (2.0 and 1.0 to
// 4.0 and 2.0 need 22 to 28). Its speed matters more: on the CPU v4 managed about one frame a second, and at 1 it needs
// 64, at 2 v4 needs 13 and this model 9.
// Playing a move that ends the game for good once shown, as nothing can reply to it, took 146 games (at the earlier
// model's 1.78 and 0.8) from 540 edits to 519: 21 games had lost their last move, a checkmate, to the board being
// cleared. One game that was already out of step got a wrong mate.
export const DEFAULT_BAYESIAN_OPTIONS: BayesianOptions = {
  provisional: true, moveChance: 0.01, temperature: 3.0, floor: 0.05, evidenceWeight: 1.5, threshold: 0.95,
  flipChance: 0.05
};

// The time between frames, in ms, that moveChance and evidenceWeight are given for: the app's 4 frames a second
const REFERENCE_INTERVAL = 250;
// The most a frame counts for, in ms, so one frame after a stall can't carry seconds of evidence
const MAX_INTERVAL = 1000;

// One way the game may have gone on since the last move played: a move, or a move and its reply
interface Hypothesis {
  // Its first move, as an index into the tracker's firsts
  first: number,
  // The reply's UCI, for a pair
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
//
// The app doesn't use it on its own: BeamTracker runs one for each way the game may have gone, splitting where one
// plays a move for good (see beamTracker.ts), so a move can still be taken back. Run on its own, as dev/replay.mjs
// --single does, it is the app's tracker before the beam, to compare against.
export class BayesianTracker {
  readonly #options: BayesianOptions;
  #movesPairs: MovesPair[] | null = null;
  #hypotheses: Hypothesis[] = [];
  // The label on each square in the position the hypotheses start from
  #root: number[] = [];
  // Each first move, and how many single moves and replies there are, worked out once per position
  #firsts: string[] = [];
  // Each first move's group: the same move, but for the piece a pawn promotes to. A pair can't tell a group's moves
  // apart when the reply takes the new piece, and the model often can't either, so the threshold is on a group's
  // share, and the move picked from it is the one with the largest share (the queen, on a tie).
  #groups = new Int32Array(0);
  #groupCount = 0;
  #replies = new Int32Array(0);
  // Whether each first move ends the game (checkmate or stalemate), so no reply can ever confirm it
  #ends = new Uint8Array(0);
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
  // How well the last frame fitted the game so far: its log-probability given the position, with every way the game
  // may have gone on weighed by its share, scaled by evidenceWeight. Unlike the evidence, which is against the
  // position not changing, it can be compared between trackers following different games (beamTracker.ts).
  #frameLogLikelihood = 0;

  constructor(options: Partial<BayesianOptions> = {}) {
    this.#options = { ...DEFAULT_BAYESIAN_OPTIONS, ...options };
  }

  get frameLogLikelihood(): number {
    return this.#frameLogLikelihood;
  }

  // A copy that goes on from here independently
  clone(): BayesianTracker {
    const copy = new BayesianTracker(this.#options);
    copy.#movesPairs = this.#movesPairs;
    copy.#hypotheses = this.#hypotheses;
    copy.#root = this.#root;
    copy.#firsts = this.#firsts;
    copy.#groups = this.#groups;
    copy.#groupCount = this.#groupCount;
    copy.#replies = this.#replies;
    copy.#ends = this.#ends;
    copy.#none = this.#none;
    copy.#belief = this.#belief.slice();
    copy.#next = new Float64Array(this.#next.length);
    copy.#evidence = new Float64Array(this.#evidence.length);
    copy.#played = this.#played;
    copy.#shown = this.#shown;
    copy.#lastTime = this.#lastTime;
    copy.#frameLogLikelihood = this.#frameLogLikelihood;
    return copy;
  }

  // Goes on as if `san` had not been played: drops every way through it, shares the rest out again, and returns the
  // share it had, which a tracker that played it (a clone from before) takes instead
  exclude(san: string): number {
    let dropped = 0;
    for (let i = 0; i < this.#hypotheses.length; i++) {
      if (this.#firsts[this.#hypotheses[i].first] === san) {
        dropped += this.#belief[i];
        this.#belief[i] = 0;
      }
    }
    const kept = 1 - dropped;
    if (kept > 0) {
      this.#none /= kept;
      for (let i = 0; i < this.#belief.length; i++) {
        this.#belief[i] /= kept;
      }
    }
    this.#played = null;
    this.#shown = null;
    return dropped;
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
      // The game has not moved on from the move just played yet
      return null;
    }
    const hypotheses = this.#hypotheses;
    const n = hypotheses.length;
    const { provisional, temperature, floor, threshold, flipChance } = this.#options;
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
    // How well the position not changing explains the frame as read, and turned round (square s read as 63 - s)
    const root = this.#root;
    let upright = 0;
    let turned = 0;
    for (let square = 0; square < 64; square++) {
      upright += logs[square * NUM_LABELS + root[square]];
      if (flipChance > 0) turned += logs[(63 - square) * NUM_LABELS + root[square]];
    }
    const uprightPrior = Math.log(1 - flipChance);
    const turnedPrior = Math.log(flipChance);
    const unchanged = (flipChance > 0) ? mix(uprightPrior + upright, turnedPrior + turned) : upright;
    this.#frameLogLikelihood = evidenceWeight * unchanged;
    if (n === 0) {
      // No legal moves: the game is over
      return null;
    }
    const evidence = this.#evidence;
    let top = 0;
    for (let i = 0; i < n; i++) {
      const { squares, labels } = hypotheses[i];
      let sum = 0;
      let turnedSum = 0;
      for (let k = 0; k < squares.length; k++) {
        const square = squares[k];
        sum += logs[square * NUM_LABELS + labels[k]] - logs[square * NUM_LABELS + root[square]];
        turnedSum += logs[(63 - square) * NUM_LABELS + labels[k]] - logs[(63 - square) * NUM_LABELS + root[square]];
      }
      if (flipChance > 0) {
        sum = mix(uprightPrior + upright + sum, turnedPrior + turned + turnedSum) - unchanged;
      }
      evidence[i] = evidenceWeight * sum;
      if (evidence[i] > top) top = evidence[i];
    }
    let total = none * Math.exp(-top);
    for (let i = 0; i < n; i++) {
      next[i] *= Math.exp(evidence[i] - top);
      total += next[i];
    }
    this.#frameLogLikelihood += top + Math.log(total);
    none = none * Math.exp(-top) / total;
    for (let i = 0; i < n; i++) {
      next[i] /= total;
    }
    this.#none = none;
    this.#belief = next;
    this.#next = belief;

    // Each first move's share in all, and each group's share in all and with a reply. The threshold is above 0.5,
    // so only the largest group can pass it.
    const groups = this.#groups;
    const shares = new Float64Array(this.#firsts.length);
    const groupShares = new Float64Array(this.#groupCount);
    const replied = new Float64Array(this.#groupCount);
    for (let i = 0; i < n; i++) {
      const first = hypotheses[i].first;
      shares[first] += next[i];
      groupShares[groups[first]] += next[i];
      if (hypotheses[i].second !== null) {
        replied[groups[first]] += next[i];
      }
    }
    const confirmed = provisional ? replied : groupShares;
    const best = largest(confirmed);
    if (confirmed[best] > threshold) {
      this.#played = this.#firsts[this.#pick(best, shares)];
      this.#shown = null;
      return { san: this.#played, greedy: false };
    }
    const shownGroup = largest(groupShares);
    if (provisional && groupShares[shownGroup] > threshold) {
      const first = this.#pick(shownGroup, shares);
      const shown = this.#firsts[first];
      if (this.#ends[first]) {
        // Nothing can reply to it, and the pieces moved as the board is cleared afterwards would replace it
        this.#played = shown;
        this.#shown = null;
        return { san: shown, greedy: false };
      }
      if (shown !== this.#shown) {
        this.#shown = shown;
        return { san: shown, greedy: true };
      }
    }
    return null;
  }

  // The first move in a group with the largest share, the earliest on a tie
  #pick(group: number, shares: Float64Array): number {
    let best = -1;
    for (let first = 0; first < shares.length; first++) {
      if (this.#groups[first] === group && (best === -1 || shares[first] > shares[best])) best = first;
    }
    return best;
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
    // The hypothesis of each first move alone, by its UCI
    const singles = new Map<string, number>();
    const ucis: string[] = [];
    for (const pair of game.movesPairs) {
      const { san, uci } = pair.move1;
      if (!singles.has(uci)) {
        singles.set(uci, hypotheses.length);
        hypotheses.push({ first: firsts.length, second: null, parent: -1, squares: [...pair.move1.from, ...pair.move1.to],
          labels: [...pair.move1.from.map(() => EMPTY), ...pair.move1.targets] });
        firsts.push(san);
        ucis.push(uci);
      }
      if (pair.move2 !== null && pair.moves !== null) {
        const parent = singles.get(uci) ?? -1;
        hypotheses.push({ first: hypotheses[parent].first, second: pair.move2.uci, parent,
          squares: [...pair.moves.from, ...pair.moves.to], labels: [...pair.moves.from.map(() => EMPTY), ...pair.moves.targets] });
      }
    }
    this.#hypotheses = hypotheses;
    this.#firsts = firsts;
    // Promotions to each piece are generated queen first, so the queen comes first in its group. A group is the UCI
    // without the piece promoted to.
    const groupOf = new Map<string, number>();
    this.#groups = Int32Array.from(ucis, (uci) => {
      const key = uci.slice(0, 4);
      let group = groupOf.get(key);
      if (group === undefined) {
        group = groupOf.size;
        groupOf.set(key, group);
      }
      return group;
    });
    this.#groupCount = groupOf.size;
    this.#replies = new Int32Array(hypotheses.length);
    for (const h of hypotheses) {
      if (h.second !== null) this.#replies[h.parent] += 1;
    }
    // Every first move has a hypothesis of its own, from the loop above
    this.#ends = Uint8Array.from(ucis, (uci) => (this.#replies[singles.get(uci) ?? -1] === 0) ? 1 : 0);
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

// log(e^a + e^b), without overflow
const mix = (a: number, b: number): number => {
  const top = Math.max(a, b);
  return (top === -Infinity) ? top : top + Math.log(Math.exp(a - top) + Math.exp(b - top));
}

// The index of the largest value
const largest = (values: Float64Array): number => {
  let best = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[best]) best = i;
  }
  return best;
}
