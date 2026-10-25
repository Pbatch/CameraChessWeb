import { describe, expect, it } from "vitest";
import gameReducer, { gameSetClock, gameUpdate, makeBoard, makePgn, makeUpdatePayload } from "./gameSlice";
import { makeGame } from "../test/helpers";

describe("makeBoard", () => {
  it("replays the stored moves", () => {
    const board = makeBoard(makeGame("1. e4 e5 2. Nf3"));
    expect(makeUpdatePayload(board)).toMatchObject({
      moves: "1. e4 e5 2. Nf3",
      fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
      lastMove: "g1f3"
    });
  });

  it("records SAN for UCI moves", () => {
    const board = makeBoard(makeGame("1. e4 e5"));
    board.playUci("g1f3");
    expect(board.history[board.history.length - 1].san).toBe("Nf3");
  });

  it("rejects malformed UCI and illegal SAN", () => {
    const board = makeBoard(makeGame());
    expect(board.playUci("zz")).toBeNull();
    expect(board.playSan("Qxh7")).toBeNull();
    expect(board.history).toHaveLength(0);
  });

  it("undoes the last move", () => {
    const board = makeBoard(makeGame("1. e4 e5 2. Nf3"));
    board.undo();
    expect(makeUpdatePayload(board)).toMatchObject({
      moves: "1. e4 e5",
      fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
      lastMove: "e7e5"
    });
  });
});

describe("makeUpdatePayload", () => {
  it("numbers a first move by black", () => {
    const board = makeBoard(makeGame("", "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"));
    board.playSan("e5");
    board.playSan("Nf3");
    expect(makeUpdatePayload(board).moves).toBe("1... e5 2. Nf3");
  });
});

describe("makePgn", () => {
  const roster = (result: string) => [
    '[Event "?"]',
    '[Site "?"]',
    '[Date "????.??.??"]',
    '[Round "?"]',
    '[White "?"]',
    '[Black "?"]',
    `[Result "${result}"]`
  ].join("\n");

  it("writes the standard tags and move text", () => {
    expect(makePgn(makeGame("1. e4 e5"))).toBe(`${roster("*")}\n\n1. e4 e5 *\n`);
  });

  it("adds SetUp and FEN for a custom start position", () => {
    const start = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    expect(makePgn(makeGame("1... e5 2. Nf3", start))).toBe(
      `${roster("*")}\n[SetUp "1"]\n[FEN "${start}"]\n\n1... e5 2. Nf3 *\n`
    );
  });

  it("records the result of a finished game", () => {
    expect(makePgn(makeGame("1. f3 e5 2. g4 Qh4#"))).toBe(`${roster("0-1")}\n\n1. f3 e5 2. g4 Qh4# 0-1\n`);
  });

  it("overrides and adds headers, escaping quotes", () => {
    const pgn = makePgn(makeGame("1. e4"), { White: 'Bob "the Bishop"', Annotator: "ChessCam" });
    expect(pgn).toContain('[White "Bob \\"the Bishop\\""]');
    expect(pgn).toContain('[Annotator "ChessCam"]\n\n1. e4 *\n');
  });

  it("handles a game with no moves", () => {
    expect(makePgn(makeGame())).toBe(`${roster("*")}\n\n*\n`);
  });
});

describe("gameUpdate", () => {
  it("keeps the start position and clock", () => {
    const clock = { wtime: 1000, btime: 2000, turn: "w" as const, updatedAt: 0, running: true };
    const state = gameReducer(makeGame(), gameSetClock(clock));
    const payload = makeUpdatePayload(makeBoard(makeGame("1. e4")));
    const updated = gameReducer(state, gameUpdate(payload));
    expect(updated).toMatchObject({ moves: "1. e4", start: state.start, clock });
  });
});
