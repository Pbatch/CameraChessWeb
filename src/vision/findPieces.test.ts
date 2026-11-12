import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GameChange, Model, RecorderOptions } from "@chesscam/recorder";
import { useStore } from "../store";
import { gameReset, gameSync, trackerReset } from "../slices/gameSlice";
import { makeGame } from "../test/helpers";

// A recorder that only records what it is asked, so the bridge to the store can be checked without a model
const fake = vi.hoisted(() => ({
  options: null as RecorderOptions | null,
  setGame: [] as GameChange[],
  reset: [] as (string | undefined)[],
  destroyed: false
}));

vi.mock("@chesscam/recorder", async (importOriginal) => ({
  ...await importOriginal<typeof import("@chesscam/recorder")>(),
  createRecorder: (options: RecorderOptions) => {
    fake.options = options;
    return {
      setGame: (change: GameChange) => fake.setGame.push(change),
      reset: (start?: string) => fake.reset.push(start),
      destroy: () => {
        fake.destroyed = true;
      }
    };
  }
}));

const { findPieces } = await import("./findPieces");

const stops: (() => void)[] = [];
const start = (mode: "record" | "upload" | "broadcast" | "play") => {
  const found = findPieces({
    model: {} as Model, video: {} as HTMLVideoElement, setText: vi.fn(), setFps: vi.fn(), setOrientation: vi.fn(),
    moveTextRef: { current: "" }, mode
  });
  stops.push(found.stop);
  return found;
}
const lastSetGame = () => fake.setGame[fake.setGame.length - 1];

beforeEach(() => {
  useStore.setState(useStore.getInitialState(), true);
  Object.assign(fake, { options: null, setGame: [], reset: [], destroyed: false });
});

afterEach(() => {
  for (const stop of stops.splice(0)) {
    stop();
  }
});

describe("findPieces", () => {
  it("times moves in record mode, and shows only final moves in play mode", () => {
    start("record");
    expect(fake.options).toMatchObject({ timed: true, finalMovesOnly: false });
    start("play");
    expect(fake.options).toMatchObject({ timed: false, finalMovesOnly: true });
    start("upload");
    expect(fake.options).toMatchObject({ timed: false, finalMovesOnly: false });
  });

  it("starts from the store's game", () => {
    const begin = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    useStore.setState({ game: makeGame("1... e5", begin) });
    start("record");
    expect(fake.options?.start).toBe(begin);
    expect(lastSetGame()).toMatchObject({ moves: "1... e5", start: begin });
  });

  it("puts the recorder's moves in the store", () => {
    start("record");
    const game = { ...makeGame("1. e4"), times: [1500] };
    fake.options?.onUpdate?.(game);
    expect(useStore.getState().game).toEqual(game);
  });

  it("passes the store's changes from elsewhere to the recorder", () => {
    start("play");
    gameSync(makeGame().start, ["e2e4", "e7e5"]);
    expect(lastSetGame()).toMatchObject({ moves: "1. e4 e5", fromOpponent: true });
    gameReset();
    expect(lastSetGame()).toMatchObject({ moves: "" });
  });

  it("starts the tracker afresh on a tracker reset, even with no moves to take back", () => {
    start("upload");
    trackerReset();
    expect(fake.reset).toEqual([makeGame().start]);
  });

  it("stops listening to the store once stopped", () => {
    const { stop } = start("upload");
    stop();
    expect(fake.destroyed).toBe(true);
    const calls = fake.setGame.length;
    gameReset();
    expect(fake.setGame.length).toBe(calls);
  });
});
