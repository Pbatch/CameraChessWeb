import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStorage, makeGame } from "./test/helpers";

const user = { token: "lip_abc", username: "magnus" };
const game = makeGame("1. e4");

const loadStore = async () => (await import("./store")).default;

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
    storage.setItem("state", JSON.stringify({ game, user }));
    const store = await loadStore();
    expect(store.getState()).toEqual({ game, user });
  });

  it("migrates redux-persist state and removes the old key", async () => {
    storage.setItem("persist:root", JSON.stringify({
      game: JSON.stringify(game),
      user: JSON.stringify(user),
      _persist: JSON.stringify({ version: 1, rehydrated: true })
    }));
    const store = await loadStore();
    expect(store.getState()).toEqual({ game, user });
    expect(JSON.parse(storage.getItem("state") ?? "")).toEqual({ game, user });
    expect(storage.getItem("persist:root")).toBeNull();
  });

  it("falls back to initial state when saved state is corrupt", async () => {
    storage.setItem("state", "{not json");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const store = await loadStore();
    expect(store.getState().user.token).toBe("");
  });

  it("saves state when it changes", async () => {
    const store = await loadStore();
    store.dispatch({ type: "game/gameSetFen", payload: "8/8/8/8/8/8/8/K6k w - - 0 1" });
    expect(JSON.parse(storage.getItem("state") ?? "").game.fen).toBe("8/8/8/8/8/8/8/K6k w - - 0 1");
  });
});
