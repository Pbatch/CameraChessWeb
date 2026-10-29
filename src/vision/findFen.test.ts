import { describe, expect, it } from "vitest";
import { makeBoardFen } from "chessops/fen";
import { kingSquares, stateToBoard } from "./findFen";
import { EMPTY, LABEL_MAP, NUM_LABELS, SQUARE_MAP } from "../utils/constants";
import { zeros } from "../utils/math";
import { oneHotState } from "../test/helpers";

// Every square empty, apart from the kings on e1 and e8
const kingsOnly = (): number[][] => oneHotState("4k3/8/8/8/8/8/8/4K3 w - - 0 1");

describe("kingSquares", () => {
  it("takes each king's best square when they differ", () => {
    expect(kingSquares(kingsOnly())).toEqual([SQUARE_MAP.e8, SQUARE_MAP.e1]);
  });

  it("moves the king with the better runner-up when both like the same square", () => {
    const state: number[][] = zeros(64, NUM_LABELS);
    state[SQUARE_MAP.e8][LABEL_MAP.k] = 0.9;
    state[SQUARE_MAP.d8][LABEL_MAP.k] = 0.5;
    state[SQUARE_MAP.e8][LABEL_MAP.K] = 0.8;
    state[SQUARE_MAP.e1][LABEL_MAP.K] = 0.7;
    // 0.9 + 0.7 beats 0.5 + 0.8
    expect(kingSquares(state)).toEqual([SQUARE_MAP.e8, SQUARE_MAP.e1]);

    state[SQUARE_MAP.d8][LABEL_MAP.k] = 0.85;
    // 0.85 + 0.8 beats 0.9 + 0.7
    expect(kingSquares(state)).toEqual([SQUARE_MAP.d8, SQUARE_MAP.e8]);
  });
});

describe("stateToBoard", () => {
  it.each([
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
    "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R",
    "8/8/8/4k3/8/8/1K6/8",
  ])("reads back %s", (boardFen) => {
    expect(makeBoardFen(stateToBoard(oneHotState(`${boardFen} w - - 0 1`)))).toBe(boardFen);
  });

  it("places one king per side, even when the model sees two", () => {
    const state = kingsOnly();
    state[SQUARE_MAP.d1] = zeros(1, NUM_LABELS)[0];
    state[SQUARE_MAP.d1][LABEL_MAP.K] = 0.6;
    state[SQUARE_MAP.d1][LABEL_MAP.Q] = 0.3;
    state[SQUARE_MAP.d1][EMPTY] = 0.1;
    expect(makeBoardFen(stateToBoard(state))).toBe("4k3/8/8/8/8/8/8/3QK3");
  });

  it("places a king on its best square even when empty is more likely", () => {
    const state = kingsOnly();
    state[SQUARE_MAP.e1][LABEL_MAP.K] = 0;
    state[SQUARE_MAP.e1][EMPTY] = 1;
    state[SQUARE_MAP.g1][LABEL_MAP.K] = 0.1;
    state[SQUARE_MAP.g1][EMPTY] = 0.9;
    expect(makeBoardFen(stateToBoard(state))).toBe("4k3/8/8/8/8/8/8/6K1");
  });

  it("only places a piece the model rates above an empty square", () => {
    const state = kingsOnly();
    state[SQUARE_MAP.e4][EMPTY] = 0.35;
    state[SQUARE_MAP.e4][LABEL_MAP.P] = 0.35;
    state[SQUARE_MAP.e4][LABEL_MAP.N] = 0.3;
    state[SQUARE_MAP.d4][EMPTY] = 0.3;
    state[SQUARE_MAP.d4][LABEL_MAP.p] = 0.4;
    state[SQUARE_MAP.d4][LABEL_MAP.b] = 0.3;
    expect(makeBoardFen(stateToBoard(state))).toBe("4k3/8/8/8/3p4/8/8/4K3");
  });

  it("never places a pawn on the first or last rank", () => {
    const state = kingsOnly();
    state[SQUARE_MAP.a8][EMPTY] = 0.1;
    state[SQUARE_MAP.a8][LABEL_MAP.P] = 0.6;
    state[SQUARE_MAP.a8][LABEL_MAP.R] = 0.3;
    state[SQUARE_MAP.h1][EMPTY] = 0.4;
    state[SQUARE_MAP.h1][LABEL_MAP.p] = 0.6;
    expect(makeBoardFen(stateToBoard(state))).toBe("R3k3/8/8/8/8/8/8/4K3");
  });
});
