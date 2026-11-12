import { beforeEach, describe, expect, it } from "vitest";
import { gameReset, gameSync, trackerReset } from "./gameSlice";
import { useStore } from "../store";
import { makeGame } from "../test/helpers";
import type { Game } from "../types";

const setGame = (game: Game) => useStore.setState({ game });
const getGame = () => useStore.getState().game;

beforeEach(() => {
  useStore.setState(useStore.getInitialState(), true);
});

describe("gameReset", () => {
  const start = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

  it("starts a new game from the given position", () => {
    setGame({ ...makeGame("1. e4 e5"), fromOpponent: true });
    gameReset(start);
    expect(getGame()).toEqual(makeGame("", start));
  });

  it("defaults to the standard start position", () => {
    setGame(makeGame("1... e5", start));
    gameReset();
    expect(getGame()).toEqual(makeGame());
  });
});

describe("trackerReset", () => {
  it("takes back every move, keeping the start position, and counts the reset", () => {
    const start = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    setGame(makeGame("1... e5 2. Nf3", start));
    const before = useStore.getState().trackerResets;
    trackerReset();
    expect(getGame()).toEqual(makeGame("", start));
    expect(useStore.getState().trackerResets).toBe(before + 1);
  });

  it("counts a reset even with no moves to take back, so detection still starts a new tracker", () => {
    setGame(makeGame());
    const before = useStore.getState().trackerResets;
    trackerReset();
    expect(useStore.getState().trackerResets).toBe(before + 1);
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
