import type { MovesData, MovesPair } from "../types";
import { EMPTY, NUM_LABELS } from "../utils/constants";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";
import type { Position } from "chessops/chess";

// Above 0.5, a class must be the most likely for its square, as the probabilities sum to 1
export const calculateScore = (state: number[][], move: MovesData, from_thr = 0.5, to_thr = 0.5) => {
  let score = 0;
  move.from.forEach(square => {
    score += state[square][EMPTY] - from_thr;
  })

  for (let i = 0; i < move.to.length; i++) {
    score += state[move.to[i]][move.targets[i]] - to_thr;
  }

  return score
}

export const processState = (state: number[][], movesPairs: MovesPair[], possibleMoves: Set<string>): {
  bestScore1: number, bestScore2: number, bestJointScore: number,
  bestMove: MovesData | null, bestMoves: MovesData | null
} => {
  let bestScore1 = Number.NEGATIVE_INFINITY;
  let bestScore2 = Number.NEGATIVE_INFINITY;
  let bestJointScore = Number.NEGATIVE_INFINITY;
  let bestMove: MovesData | null = null;
  let bestMoves: MovesData | null = null;
  const seen: Set<string> = new Set();

  movesPairs.forEach(movePair => {
    if (!seen.has(movePair.move1.sans[0])) {
      seen.add(movePair.move1.sans[0]);
      const score = calculateScore(state, movePair.move1);
      if (score > 0) {
        possibleMoves.add(movePair.move1.sans[0]);
      }
      if (score > bestScore1) {
        bestMove = movePair.move1;
        bestScore1 = score;
      }
    }

    if ((movePair.move2 === null) || (movePair.moves === null) || !(possibleMoves.has(movePair.move1.sans[0]))) {
      return;
    }

    const score2: number = calculateScore(state, movePair.move2);
    if (score2 < 0) {
      return;
    } else if (score2 > bestScore2) {
      bestScore2 = score2;
    }

    const jointScore: number = calculateScore(state, movePair.moves);
    if (jointScore > bestJointScore) {
      bestJointScore = jointScore;
      bestMoves = movePair.moves;
    }
  })

  return { bestScore1, bestScore2, bestJointScore, bestMove, bestMoves };
}

const updateState = (state: number[][], update: number[][], decay: number = 0.5) => {
  for (let i = 0; i < 64; i++) {
    for (let j = 0; j < NUM_LABELS; j++) {
      state[i][j] = decay * state[i][j] + (1 - decay) * update[i][j]
    }
  }
  return state
}

// How long a single move must stay the best, without a break, before it is played, in ms
const GREEDY_TIME = 1000;

// The best single move, and since when it has been the best without a break
export class GreedyTimer {
  #move: string | null = null;
  #since: number = 0;

  reset() {
    this.#move = null;
  }

  // Whether the move has been the best for long enough. A null move (no good move this frame) is a break.
  update(move: string | null, now: number): boolean {
    if (move === null) {
      this.#move = null;
      return false;
    }
    // A different best move restarts the timer
    if (move !== this.#move) {
      this.#move = move;
      this.#since = now;
    }
    return (now - this.#since) > GREEDY_TIME;
  }
}

const sanToLan = (board: Position, san: string): string => {
  const move = parseSan(board, san);
  if (!move) return "";
  return makeUci(move);
}

// The game as the tracker sees it: the position before any greedy move, so a greedy move can still be
// replaced by a pair, and its pairs of moves from there
export interface TrackerGame {
  movesPairs: MovesPair[],
  position: Position,
  // The last move shown in UCI, which is the greedy move if one is waiting
  lastMove: string
}

// A move to play. A greedy move is a single move that a pair seen later may replace.
export interface TrackerMove {
  san: string,
  greedy: boolean
}

// Decides which move, if any, each frame's probabilities show. It has no clock or side effects of its own,
// so recorded frames can be replayed through it.
export class MoveTracker {
  #state: number[][] | null = null;
  #possibleMoves: Set<string> = new Set();
  #greedy = new GreedyTimer();
  readonly #pairs: boolean;

  // Without pairs, only single moves are played, and none is greedy
  constructor(pairs: boolean = true) {
    this.#pairs = pairs;
  }

  // Whether a frame has come in since the start or the last reset
  get started(): boolean {
    return this.#state !== null;
  }

  // Forgets the smoothed state and what it had seen, e.g. while detection is paused
  reset() {
    this.#state = null;
    this.#possibleMoves.clear();
    this.#greedy.reset();
  }

  // `update` is a 64x13 state in square order, and `now` is the frame's time in ms
  update(update: number[][], now: number, { movesPairs, position, lastMove }: TrackerGame): TrackerMove | null {
    // The first frame starts the state, so detection does not wait for it to climb from zero
    this.#state = (this.#state === null) ? update : updateState(this.#state, update);
    const { bestScore1, bestScore2, bestJointScore, bestMove, bestMoves } =
      processState(this.#state, movesPairs, this.#possibleMoves);

    if (this.#pairs && (bestMoves !== null) && (bestScore2 > 0) && (bestJointScore > 0)) {
      this.#possibleMoves.clear();
      this.#greedy.reset();
      return { san: bestMoves.sans[0], greedy: false };
    }

    const greedyMove: string | null = (bestMove === null || (bestScore1 <= 0)) ? null : bestMove.sans[0];
    if (this.#greedy.update(greedyMove, now) && greedyMove !== null &&
      sanToLan(position, greedyMove) !== lastMove) {
      this.#greedy.reset();
      return { san: greedyMove, greedy: this.#pairs };
    }
    return null;
  }
}
