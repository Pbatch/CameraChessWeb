import { describe, expect, it } from "vitest";
import { calculateScore, GreedyTimer, processState } from "./findPieces";
import { getMovesPairs } from "../chess/moves";
import { makeBoard } from "../slices/gameSlice";
import { EMPTY, LABEL_MAP, SQUARE_MAP } from "../utils/constants";
import { makeGame, oneHotState } from "../test/helpers";

const AFTER_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
const AFTER_E4_E5 = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
const CASTLING = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";

const pairsFor = (fen?: string) => getMovesPairs(makeBoard(makeGame("", fen)).position);

const firstMove = (fen: string | undefined, san: string) => {
  const pair = pairsFor(fen).find(({ move1 }) => move1.sans[0] === san);
  if (pair === undefined) {
    throw new Error(`No move ${san} from ${fen}`);
  }
  return pair.move1;
}

describe("calculateScore", () => {
  it("adds how far each square is above 0.5 for its expected class", () => {
    const state = oneHotState(AFTER_E4);
    state[SQUARE_MAP.e2][EMPTY] = 0.7;
    state[SQUARE_MAP.e4][EMPTY] = 0.4;
    state[SQUARE_MAP.e4][LABEL_MAP.P] = 0.6;
    expect(calculateScore(state, firstMove(undefined, "e4"))).toBeCloseTo(0.3);
  });

  it("scores a move that hasn't happened below 0", () => {
    expect(calculateScore(oneHotState(AFTER_E4), firstMove(undefined, "d4"))).toBe(-1);
  });

  it("needs the rook to move too when castling", () => {
    const castle = firstMove(CASTLING, "O-O");
    expect(calculateScore(oneHotState("r3k2r/8/8/8/8/8/8/R5KR w - - 0 1"), castle)).toBe(0);
    expect(calculateScore(oneHotState("r3k2r/8/8/8/8/8/8/R4RK1 w - - 0 1"), castle)).toBe(2);
  });
});

describe("processState", () => {
  it("finds no move on an unchanged board", () => {
    const possibleMoves = new Set<string>();
    const result = processState(oneHotState(makeGame().start), pairsFor(), possibleMoves);
    expect(possibleMoves.size).toBe(0);
    expect(result.bestScore1).toBe(-1);
    expect(result.bestMoves).toBeNull();
    expect(result.bestJointScore).toBe(Number.NEGATIVE_INFINITY);
  });

  it("finds the single move, without a pair, when only one side has moved", () => {
    const possibleMoves = new Set<string>();
    const result = processState(oneHotState(AFTER_E4), pairsFor(), possibleMoves);
    expect([...possibleMoves]).toEqual(["e4"]);
    expect(result.bestMove?.sans).toEqual(["e4"]);
    expect(result.bestScore1).toBe(1);
    expect(result.bestMoves).toBeNull();
    expect(result.bestScore2).toBe(Number.NEGATIVE_INFINITY);
  });

  it("finds both moves when both sides have moved", () => {
    const possibleMoves = new Set<string>();
    const result = processState(oneHotState(AFTER_E4_E5), pairsFor(), possibleMoves);
    expect(result.bestMoves?.sans).toEqual(["e4", "e5"]);
    expect(result.bestScore2).toBe(1);
    expect(result.bestJointScore).toBe(2);
  });

  // e2 is covered by a hand, so e4 alone no longer scores above 0
  const handOverE2 = () => {
    const state = oneHotState(AFTER_E4_E5);
    state[SQUARE_MAP.e2][EMPTY] = 0.4;
    state[SQUARE_MAP.e4][EMPTY] = 0.7;
    state[SQUARE_MAP.e4][LABEL_MAP.P] = 0.3;
    return state;
  }

  it("only pairs a first move that is possible now or was on an earlier frame", () => {
    expect(processState(handOverE2(), pairsFor(), new Set()).bestMoves).toBeNull();

    const result = processState(handOverE2(), pairsFor(), new Set(["e4"]));
    expect(result.bestMoves?.sans).toEqual(["e4", "e5"]);
    expect(result.bestJointScore).toBeCloseTo(0.7);
  });

  it("prefers castling to the rook move alone", () => {
    const possibleMoves = new Set<string>();
    const result = processState(oneHotState("r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1"), pairsFor(CASTLING), possibleMoves);
    expect(result.bestMove?.sans).toEqual(["O-O"]);
    expect(result.bestScore1).toBe(2);
    // Rf1 also explains the rook on f1, but not the king on g1
    expect([...possibleMoves].sort()).toEqual(["O-O", "Rf1"]);
  });
});

describe("GreedyTimer", () => {
  it("is ready once the same move has been the best for over a second", () => {
    const timer = new GreedyTimer();
    expect(timer.update("e4", 0)).toBe(false);
    expect(timer.update("e4", 1000)).toBe(false);
    expect(timer.update("e4", 1001)).toBe(true);
  });

  it("restarts when the best move changes", () => {
    const timer = new GreedyTimer();
    timer.update("e4", 0);
    timer.update("d4", 600);
    expect(timer.update("e4", 1200)).toBe(false);
    expect(timer.update("e4", 2201)).toBe(true);
  });

  it("restarts after a frame without a move", () => {
    const timer = new GreedyTimer();
    timer.update("e4", 0);
    expect(timer.update(null, 500)).toBe(false);
    expect(timer.update("e4", 1001)).toBe(false);
    expect(timer.update("e4", 2002)).toBe(true);
  });

  it("restarts when reset", () => {
    const timer = new GreedyTimer();
    timer.update("e4", 0);
    timer.reset();
    expect(timer.update("e4", 1001)).toBe(false);
  });
});
