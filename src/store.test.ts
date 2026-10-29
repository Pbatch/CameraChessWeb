import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStorage, makeGame } from "./test/helpers";

const user = { token: "lip_abc", username: "magnus" };
const game = makeGame("1. e4");
const clock = { wtime: 1000, btime: 2000, turn: "w" as const, updatedAt: 0, running: true };

const loadStore = async () => (await import("./store")).useStore;
// The slices from the same module registry as the last loaded store
const loadSlices = async () => ({ ...await import("./slices/gameSlice"), ...await import("./slices/errorSlice") });
const saved = (storage: Storage) => JSON.parse(storage.getItem("chesscam") ?? "null");

class FullStorage extends MemoryStorage {
  seed(key: string, value: string) {
    super.setItem(key, value);
  }

  setItem() {
    throw new DOMException("Quota exceeded", "QuotaExceededError");
  }
}

describe("store", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    vi.resetModules();
    storage = new MemoryStorage();
    vi.stubGlobal("localStorage", storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("restores saved state", async () => {
    storage.setItem("chesscam", JSON.stringify({ state: { game, user }, version: 1 }));
    const store = await loadStore();
    expect(store.getState()).toEqual({ game, user, errors: [] });
  });

  it("migrates Redux state and removes the old key", async () => {
    storage.setItem("state", JSON.stringify({ game, user }));
    const store = await loadStore();
    expect(store.getState()).toEqual({ game, user, errors: [] });
    expect(saved(storage)).toEqual({ state: { game, user }, version: 1 });
    expect(storage.getItem("state")).toBeNull();
  });

  it("migrates redux-persist state and removes the old key", async () => {
    storage.setItem("persist:root", JSON.stringify({
      game: JSON.stringify(game),
      user: JSON.stringify(user),
      _persist: JSON.stringify({ version: 1, rehydrated: true })
    }));
    const store = await loadStore();
    expect(store.getState()).toEqual({ game, user, errors: [] });
    expect(saved(storage)).toEqual({ state: { game, user }, version: 1 });
    expect(storage.getItem("persist:root")).toBeNull();
  });

  it("keeps the Redux state when the migrated state cannot be saved", async () => {
    const full = new FullStorage();
    full.seed("state", JSON.stringify({ game, user }));
    vi.stubGlobal("localStorage", full);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const store = await loadStore();
    expect(store.getState().user).toEqual(user);
    expect(full.getItem("state")).not.toBeNull();
  });

  it("falls back to initial state when saved state is corrupt", async () => {
    storage.setItem("chesscam", "{not json");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const store = await loadStore();
    expect(store.getState().user.token).toBe("");
  });

  it("fills missing fields and drops unknown ones from older saves", async () => {
    const { clock: _clock, ...oldGame } = game;
    storage.setItem("state", JSON.stringify({ game: { ...oldGame, error: "Old error" }, user: {} }));
    const store = await loadStore();
    expect(store.getState()).toEqual({ game, user: { token: "", username: "" }, errors: [] });
  });

  it("saves state when it changes", async () => {
    await loadStore();
    (await loadSlices()).gameReset("8/8/8/8/8/8/8/K6k w - - 0 1");
    expect(saved(storage).state.game.fen).toBe("8/8/8/8/8/8/8/K6k w - - 0 1");
  });

  it("does not save the clock, who made the last move or errors", async () => {
    const store = await loadStore();
    const { errorShow, gameSetClock, gameUpdate, makeUpdatePayload, makeBoard } = await loadSlices();
    const update = makeUpdatePayload(makeBoard(game));
    gameSetClock(clock);
    gameUpdate({ ...update, fromOpponent: true });
    errorShow({ source: "login", message: "Something failed" });
    expect(store.getState().game).toMatchObject({ clock, fromOpponent: true });
    expect(saved(storage)).toEqual({
      state: { game: { ...game, ...update, clock: null, fromOpponent: false }, user: { token: "", username: "" } },
      version: 1
    });
  });

  it("clears saved state, including the Redux keys", async () => {
    storage.setItem("chesscam", "{}");
    storage.setItem("state", "{}");
    storage.setItem("persist:root", "{}");
    (await import("./store")).clearSavedState();
    expect(storage.length).toBe(0);
  });
});
