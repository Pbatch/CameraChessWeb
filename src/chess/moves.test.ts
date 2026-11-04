import { describe, expect, it } from "vitest";
import { getMovesPairs, getMoveText } from "./moves";
import { makeBoard } from "../slices/gameSlice";
import { LABEL_MAP, SQUARE_MAP } from "../utils/constants";
import { makeGame } from "../test/helpers";

const pairsFor = (fen: string) => getMovesPairs(makeBoard(makeGame("", fen)).position);

const firstMove = (fen: string, san: string) => {
  const pair = pairsFor(fen).find(({ move1 }) => move1.san === san);
  if (pair === undefined) {
    throw new Error(`No move ${san} from ${fen}`);
  }
  return pair.move1;
}

describe("getMovesPairs", () => {
  it("pairs every first move with every reply from the start position", () => {
    const pairs = pairsFor("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    expect(pairs).toHaveLength(400);
    expect(pairs.every(({ move2 }) => move2 !== null)).toBe(true);
  });

  it("combines both moves, dropping squares the reply reuses", () => {
    const pair = pairsFor("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
      .find(({ move1, move2 }) => move1.san === "e4" && move2?.uci === "d7d5");
    expect(pair?.moves).toEqual({
      from: [SQUARE_MAP.e2, SQUARE_MAP.d7],
      to: [SQUARE_MAP.e4, SQUARE_MAP.d5],
      targets: [LABEL_MAP.P, LABEL_MAP.p]
    });
  });

  it("includes the rook squares when castling", () => {
    expect(firstMove("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "O-O")).toEqual({
      uci: "e1g1",
      san: "O-O",
      from: [SQUARE_MAP.e1, SQUARE_MAP.h1],
      to: [SQUARE_MAP.g1, SQUARE_MAP.f1],
      targets: [LABEL_MAP.K, LABEL_MAP.R]
    });
  });

  it("includes the captured pawn's square for en passant", () => {
    expect(firstMove("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1", "exd6").from)
      .toEqual([SQUARE_MAP.e5, SQUARE_MAP.d5]);
  });

  it("targets the promoted piece", () => {
    const fen = "4k3/P7/8/8/8/8/8/4K3 w - - 0 1";
    expect(firstMove(fen, "a8=Q+")).toMatchObject({ uci: "a7a8q", targets: [LABEL_MAP.Q] });
    expect(firstMove(fen, "a8=N")).toMatchObject({ uci: "a7a8n", targets: [LABEL_MAP.N] });
  });

  it("names each reply as the next position names that move", () => {
    // The tracker hands a reply's share on to the same move from the position after the first, by its UCI
    const fen = "r3k2r/1P6/8/8/8/8/8/R3K2R b KQkq - 0 1";
    const board = makeBoard(makeGame("", fen));
    const replies = new Set(getMovesPairs(board.position).filter(({ move1 }) => move1.san === "Kd8")
      .map(({ move2 }) => move2?.uci));
    board.playSan("Kd8");
    const firsts = new Set(getMovesPairs(board.position).map(({ move1 }) => move1.uci));
    expect(replies).toEqual(firsts);
    expect(firsts).toContain("e1g1");
    expect(firsts).toContain("b7b8q");
  });

  it("leaves move2 empty when the first move ends the game", () => {
    const mate = pairsFor("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1")
      .find(({ move1 }) => move1.san === "Ra8#");
    expect(mate).toMatchObject({ move2: null, moves: null });
  });
});

describe("getMoveText", () => {
  const blackToMove = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

  it.each([
    ["", "", ""],
    ["1. e4", "", "1.e4"],
    ["1. e4 e5", "", "1.e4 e5"],
    ["1. e4 e5 2. Nf3", "", "1...e5 2.Nf3"],
    ["1. e4 e5 2. Nf3 Nc6", "", "2.Nf3 Nc6"],
    ["1... e5", blackToMove, "1...e5"],
    ["1... e5 2. Nf3", blackToMove, "1...e5 2.Nf3"],
    ["1... e5 2. Nf3 Nc6", blackToMove, "2.Nf3 Nc6"],
    ["20. Kf2", "4k3/8/8/8/8/8/8/4K3 w - - 0 20", "20.Kf2"],
  ])("shows %s from %s as %s", (moves, start, expected) => {
    expect(getMoveText(makeBoard(makeGame(moves, start || undefined)))).toBe(expected);
  });
});
