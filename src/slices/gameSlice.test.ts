import { beforeEach, describe, expect, it } from "vitest";
import { gameReset, gameRestart, gameSetClock, gameSync, gameUpdate, makeBoard, makePgn, makeUpdatePayload } from "./gameSlice";
import { useStore } from "../store";
import { makeGame } from "../test/helpers";
import type { Game } from "../types";

const setGame = (game: Game) => useStore.setState({ game });
const getGame = () => useStore.getState().game;

beforeEach(() => {
  useStore.setState(useStore.getInitialState(), true);
});

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
    expect(board.playUci("e2e5")).toBeNull();
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

  it("writes the time each move took, in whole seconds", () => {
    const pgn = makePgn({ ...makeGame("1. e4 e5 2. Nf3"), times: [4400, 65600, 3725000] });
    expect(pgn).toBe(`${roster("*")}\n\n1. e4 { [%emt 0:00:04] } e5 { [%emt 0:01:01] } ` +
      "2. Nf3 { [%emt 1:00:59] } *\n");
  });
});

describe("gameUpdate", () => {
  it("keeps the start position and clock", () => {
    const clock = { wtime: 1000, btime: 2000, turn: "w" as const, updatedAt: 0, running: true };
    gameSetClock(clock);
    gameUpdate(makeUpdatePayload(makeBoard(makeGame("1. e4"))));
    expect(getGame()).toMatchObject({ moves: "1. e4", start: makeGame().start, clock });
  });

  it("times only the new moves", () => {
    gameUpdate(makeUpdatePayload(makeBoard(makeGame("1. e4"))), 1000);
    gameUpdate(makeUpdatePayload(makeBoard(makeGame("1. e4 e5"))), 3000);
    expect(getGame().times).toEqual([1000, 3000]);
  });

  it("retimes a greedy move that is replaced, but not one that is confirmed", () => {
    gameUpdate(makeUpdatePayload(makeBoard(makeGame("1. e4")), true), 1000);
    gameUpdate(makeUpdatePayload(makeBoard(makeGame("1. e4"))), 2000);
    expect(getGame().times).toEqual([1000]);
    gameUpdate(makeUpdatePayload(makeBoard(makeGame("1. e4 e6")), true), 3000);
    gameUpdate(makeUpdatePayload(makeBoard(makeGame("1. e4 e5"))), 4000);
    expect(getGame().times).toEqual([1000, 4000]);
  });

  it("leaves the game untimed without an elapsed time", () => {
    setGame({ ...makeGame("1. e4"), times: [1000] });
    gameUpdate(makeUpdatePayload(makeBoard(makeGame("1. e4 e5"))));
    expect(getGame().times).toEqual([]);
  });
});

describe("gameReset", () => {
  const start = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
  const clock = { wtime: 1000, btime: 2000, turn: "w" as const, updatedAt: 0, running: true };

  it("starts a new game from the given position, keeping the clock", () => {
    setGame({ ...makeGame("1. e4 e5"), greedy: true, fromOpponent: true, clock });
    gameReset(start);
    expect(getGame()).toEqual({ ...makeGame("", start), clock });
  });

  it("defaults to the standard start position", () => {
    setGame(makeGame("1... e5", start));
    gameReset();
    expect(getGame()).toEqual(makeGame());
  });
});

describe("gameRestart", () => {
  it("takes back every move, keeping the start position", () => {
    const start = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    setGame(makeGame("", start));
    gameUpdate(makeUpdatePayload(makeBoard(makeGame("1... e5 2. Nf3", start)), true));
    gameRestart();
    expect(getGame()).toEqual(makeGame("", start));
  });
});

describe("gameSync", () => {
  const start = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

  it("joins a game in progress from its start position", () => {
    gameSync(makeGame().start, ["e2e4", "e7e5", "g1f3"]);
    expect(getGame()).toMatchObject({ moves: "1. e4 e5 2. Nf3", lastMove: "g1f3", fromOpponent: true });
    expect(getGame().fen.split(" ")[1]).toBe("b");
  });

  it("takes a game's start position from Lichess", () => {
    gameSync(start, ["e7e5"]);
    expect(getGame()).toMatchObject({ moves: "1... e5", start, fromOpponent: true });
  });

  it("keeps our moves that Lichess has not seen yet", () => {
    setGame({ ...makeGame("1. e4 e5 2. Nf3"), lastMove: "g1f3" });
    gameSync(makeGame().start, ["e2e4", "e7e5"]);
    expect(getGame()).toMatchObject({ moves: "1. e4 e5 2. Nf3", fromOpponent: false });
  });

  it("replaces moves that do not match Lichess", () => {
    setGame(makeGame("1. e4 e5 2. Nf3"));
    gameSync(makeGame().start, ["e2e4", "c7c5"]);
    expect(getGame()).toMatchObject({ moves: "1. e4 c5", lastMove: "c7c5", fromOpponent: true });
  });

  it("understands castling in Lichess's UCI", () => {
    gameSync(makeGame().start, ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6", "e1g1"]);
    expect(getGame().moves).toBe("1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. O-O");
  });

  it("refuses a move that is illegal from the start position", () => {
    expect(() => gameSync(start, ["e2e4"])).toThrow("illegal");
    expect(getGame()).toEqual(makeGame());
  });
});
