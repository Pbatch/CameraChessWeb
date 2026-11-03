import type { Position } from "chessops/chess";
import { makeFen } from "chessops/fen";
import { parseSan } from "chessops/san";
import { GameBoard, makeBoard } from "../chess/board";
import { getMovesPairs } from "../chess/moves";
import type { Game, MovesPair } from "../types";
import { BayesianTracker, DEFAULT_BAYESIAN_OPTIONS, type BayesianOptions } from "./bayesianTracker";

// Follows several ways the game may have gone at once, so a move played for good can still be taken back when later
// frames fit a game without it better, such as a capture and recapture that a hand over the board seemed to show. Used
// wherever moves can be changed after they are shown; play mode, whose moves go to Lichess straight away, uses a single
// BayesianTracker.
//
// Each history is a list of moves since the moves that are final, and a BayesianTracker looking on from the position
// after them. Where a tracker would play a move for good, the history splits in two: a copy plays it, taking that
// move's share of the tracker's belief, and the original goes on without it, taking the rest. A history's score is
// the log-probability of every frame given its moves (scaled by evidenceWeight, as the tracker's evidence is), plus
// the log of each share it took when splitting, so histories with different moves can be compared. Each frame the best
// `width` histories are kept, and those more than `margin` behind the best are dropped, as is any that parted from
// the best more than `horizon` seconds ago: over a longer time, a square the model keeps misreading (a piece hidden
// behind another) can add up enough to favour a wrong game. Histories that reach the same position are merged,
// keeping the better. Moves all the histories share are final.
//
// The game shown is the best history's, with its provisional move. When the app's game changes other than by this
// tracker (a move taken back, a new game), it starts again from there, with every move in it final, as the user has
// just set them. Pausing detection doesn't start it again, so a move from just before a pause can still be corrected.

export interface BeamOptions {
  // How many histories to keep
  width: number,
  // How far behind the best a history may fall before it is dropped, in log-probability per unit of evidenceWeight,
  // as the scores scale with it
  margin: number,
  // Seconds after which the best history's moves are final
  horizon: number,
  // Whether to show only final moves, for play mode, which sends each move to Lichess as soon as it is shown
  finalOnly: boolean
}

// From replaying 146 recorded games (dev/replay.mjs), at the earlier model's temperature 1.78 and evidenceWeight 0.8:
// one tracker needed 540 edits to fix (87.2% right before the first mistake, 80 games perfect), 8 histories 349,
// with a 10 s horizon 333, and 4 histories 324 (92.7%, 89 perfect; 16 histories 335), for about 10% more time in
// all. The margin was 30 at that evidenceWeight; 15 needed 396 edits and 60 326 (with 8 histories). On alternating
// halves of the games, one tracker needed 295 and 245 edits, and 4 histories 201 and 123. Neither capping how much
// one frame can count against a history (as if a frame may be junk, such as an arm over the board) nor how much a
// history loses by going on without a move helped: they kept wrong histories alive too (330 to 575 edits). Nor did
// counting a piece read as missing for less (790 or more), as most of a move's evidence is its piece leaving.
export const DEFAULT_BEAM_OPTIONS: BeamOptions = { width: 4, margin: 30 / 0.8, horizon: 10, finalOnly: false };

// Play mode can't take a move back once Lichess has it, so it only sends final moves, and as the clock is running, a
// move is final after at most a second: a move the tracker plays is sent once its history is still the best a second
// on, or sooner once no other history is within the margin. The opponent's moves come from Lichess, which changes the
// game, so the tracker starts again after each. Its trackers play a move on its own, as the reply comes from Lichess.
// Replayed as play mode on recorded games (both sides' moves read from the board, so harder than play mode, where
// the opponent's come from Lichess), one tracker playing each move on its own share needed 1236 edits on 44 games
// (v2 model, 53.3% right before the first mistake) and 2978 on 146 (earlier model); this, 542 (76.4%) and 1271. Moves
// went a second later: a median of 1.0 s after the true move against -0.1 s, and 90% within 1.35 s against 0.15 s.
export const PLAY_TRACKER_OPTIONS: Partial<BayesianOptions> = { provisional: false };
export const PLAY_BEAM_OPTIONS: Partial<BeamOptions> = { horizon: 1, finalOnly: true };

// What the tracker shows: the whole game, and when each move was played (the `now` of the frame its tracker played
// it on, or null for a provisional move or one from before the tracker started)
export interface BeamMove {
  board: GameBoard,
  times: (number | null)[]
}

interface History {
  // Moves after the final ones, and when each was played, in ms
  sans: string[],
  times: number[],
  position: Position,
  movesPairs: MovesPair[],
  tracker: BayesianTracker,
  score: number,
  // The move shown provisionally after `sans`, if any
  greedy: string | null
}

export class BeamTracker {
  readonly #options: BeamOptions;
  readonly #trackerOptions: BayesianOptions;
  // The game up to the moves that are final, and the histories on from it. Null until the first frame.
  #start: string = "";
  #final: string[] = [];
  #finalTimes: (number | null)[] = [];
  #histories: History[] | null = null;
  // The moves the app's game had when this tracker last checked or changed it, to see if anything else changed it
  #known: string | null = null;
  // The game last shown, as SAN with the provisional move, to show a change only once
  #shown: string = "";
  // Moves and replies from each position, by FEN, shared between histories
  #pairs = new Map<string, MovesPair[]>();

  constructor(trackerOptions: Partial<BayesianOptions> = {}, options: Partial<BeamOptions> = {}) {
    this.#options = { ...DEFAULT_BEAM_OPTIONS, ...options };
    this.#trackerOptions = { ...DEFAULT_BAYESIAN_OPTIONS, ...trackerOptions };
  }

  get histories(): readonly History[] {
    return this.#histories ?? [];
  }

  // `update` is a 64x13 state in square order for one frame, `now` its time in ms, and `game` the app's game as it is
  // now. Returns the game to show, if it changed.
  update(update: number[][], now: number, game: Game): BeamMove | null {
    if (this.#histories === null || game.start !== this.#start || game.moves !== this.#known) {
      this.#restart(game);
    }
    const histories = this.#histories!;
    const next: History[] = [];
    for (const history of histories) {
      const move = history.tracker.update(update, now, { movesPairs: history.movesPairs, position: history.position });
      history.score += history.tracker.frameLogLikelihood;
      if (move === null) {
        next.push(history);
      } else if (move.greedy) {
        history.greedy = move.san;
        next.push(history);
      } else {
        // Split: a copy plays the move, and this history goes on without it
        const played = history.tracker.clone();
        const share = history.tracker.exclude(move.san);
        const position = history.position.clone();
        position.play(parseSan(position, move.san)!);
        next.push({
          sans: [...history.sans, move.san], times: [...history.times, now], position,
          movesPairs: this.#movesPairs(position), tracker: played, score: history.score + Math.log(share), greedy: null
        });
        if (share < 1) {
          history.score += Math.log(1 - share);
          history.greedy = null;
          next.push(history);
        }
      }
    }
    this.#histories = this.#prune(next, now);
    this.#finalise();

    const best = this.#options.finalOnly ? { sans: [], times: [], greedy: null } : this.#histories[0];
    const sans = [...this.#final, ...best.sans, ...((best.greedy === null) ? [] : [best.greedy])];
    const shown = sans.join(" ");
    if (shown === this.#shown) {
      return null;
    }
    this.#shown = shown;
    const board = new GameBoard(this.#start);
    for (const san of sans) {
      board.playSan(san);
    }
    this.#known = board.moves;
    const times = [...this.#finalTimes, ...best.times, ...((best.greedy === null) ? [] : [null])];
    return { board, times };
  }

  // One history from the app's game, all of whose moves are final
  #restart(game: Game) {
    const board = makeBoard(game);
    this.#start = game.start;
    this.#final = board.history.map(({ san }) => san);
    this.#finalTimes = this.#final.map(() => null);
    this.#known = game.moves;
    this.#shown = this.#final.join(" ");
    const position = board.position.clone();
    this.#histories = [{
      sans: [], times: [], position, movesPairs: this.#movesPairs(position),
      tracker: new BayesianTracker(this.#trackerOptions), score: 0, greedy: null
    }];
  }

  // The best histories, best first, one per position, with scores relative to the best
  #prune(histories: History[], now: number): History[] {
    histories.sort((a, b) => b.score - a.score);
    const margin = this.#options.margin * this.#trackerOptions.evidenceWeight;
    const horizon = now - 1000 * this.#options.horizon;
    const seen = new Set<string>();
    const kept: History[] = [];
    for (const history of histories) {
      const key = positionKey(history.position);
      if (seen.has(key) || history.score < histories[0].score - margin || parted(history, histories[0]) < horizon) {
        continue;
      }
      seen.add(key);
      kept.push(history);
      if (kept.length === this.#options.width) break;
    }
    const best = kept[0].score;
    for (const history of kept) history.score -= best;
    return kept;
  }

  // Moves every history has are final
  #finalise() {
    const histories = this.#histories!;
    let shared = 0;
    while (histories.every((h) => shared < h.sans.length && h.sans[shared] === histories[0].sans[shared])) {
      shared += 1;
    }
    if (shared === 0) return;
    this.#final.push(...histories[0].sans.slice(0, shared));
    this.#finalTimes.push(...histories[0].times.slice(0, shared));
    for (const history of histories) {
      history.sans = history.sans.slice(shared);
      history.times = history.times.slice(shared);
    }
  }

  #movesPairs(position: Position): MovesPair[] {
    const key = positionKey(position);
    let pairs = this.#pairs.get(key);
    if (pairs === undefined) {
      if (this.#pairs.size > 500) this.#pairs.clear();
      pairs = getMovesPairs(position);
      this.#pairs.set(key, pairs);
    }
    return pairs;
  }
}

// When two histories parted: when the first move one played and the other didn't was played, in ms
const parted = (a: History, b: History): number => {
  let k = 0;
  while (k < a.sans.length && k < b.sans.length && a.sans[k] === b.sans[k]) k += 1;
  return Math.min(a.times[k] ?? Infinity, b.times[k] ?? Infinity);
}

// The position, without the move counters, which differ between move orders that reach it
const positionKey = (position: Position): string => makeFen(position.toSetup()).split(" ").slice(0, 4).join(" ");
