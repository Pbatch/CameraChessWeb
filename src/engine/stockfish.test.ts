import { describe, expect, it } from "vitest";
import { formatShortScore, parseInfo, toWhite, winningChances } from "./stockfish";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AFTER_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
// Fool's mate: White is mated
const MATED = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";

describe("parseInfo", () => {
  it("reads depth and score", () => {
    expect(parseInfo("info depth 20 seldepth 27 multipv 1 score cp 31 nodes 9 nps 9 time 5 pv e2e4 e7e5 g1f3"))
      .toEqual({ depth: 20, score: { type: "cp", value: 31 } });
  });

  it("reads mates", () => {
    expect(parseInfo("info depth 5 score mate -2 pv h7h8")?.score).toEqual({ type: "mate", value: -2 });
  });

  it("skips bounds and lines without a score", () => {
    expect(parseInfo("info depth 18 score cp 40 lowerbound pv e2e4")).toBeNull();
    expect(parseInfo("info depth 18 currmove e2e4 currmovenumber 1")).toBeNull();
    expect(parseInfo("info string NNUE evaluation enabled")).toBeNull();
    expect(parseInfo("bestmove e2e4")).toBeNull();
  });
});

describe("scores", () => {
  it("turns Black's scores to White's", () => {
    expect(toWhite({ type: "cp", value: 30 }, START)).toEqual({ type: "cp", value: 30 });
    expect(toWhite({ type: "cp", value: 30 }, AFTER_E4)).toEqual({ type: "cp", value: -30 });
    expect(toWhite({ type: "mate", value: 2 }, AFTER_E4)).toEqual({ type: "mate", value: -2 });
  });

  it("formats short scores for the bar", () => {
    expect(formatShortScore({ type: "cp", value: 35 })).toBe("0.3");
    expect(formatShortScore({ type: "cp", value: -184 })).toBe("1.8");
    expect(formatShortScore({ type: "cp", value: 1249 })).toBe("12");
    expect(formatShortScore({ type: "mate", value: -3 })).toBe("M3");
    expect(formatShortScore({ type: "mate", value: 0 })).toBe("#");
  });

  it("gives Lichess's winning chances", () => {
    expect(winningChances({ type: "cp", value: 0 }, START)).toBeCloseTo(0);
    expect(winningChances({ type: "cp", value: 300 }, START)).toBeCloseTo(0.5023, 4);
    // Clamped at 10 pawns
    expect(winningChances({ type: "cp", value: 5000 }, START)).toBe(winningChances({ type: "cp", value: 1000 }, START));
    // Mate in 1 counts as 20 pawns, and mate in 10 or more as 11
    expect(winningChances({ type: "mate", value: -1 }, START)).toBeCloseTo(-0.9987, 4);
    expect(winningChances({ type: "mate", value: 15 }, START)).toBe(winningChances({ type: "mate", value: 10 }, START));
    // Mate on the board, with White to move, so Black has won
    expect(winningChances({ type: "mate", value: 0 }, MATED)).toBe(-1);
  });
});
