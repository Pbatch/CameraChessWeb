import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStorage } from "./test/helpers";

const user = { token: "lip_abc", username: "magnus" };

const loadStore = async () => (await import("./store")).useStore;
// The slices from the same module registry as the last loaded store
const loadSlices = async () => ({
  ...await import("./slices/gameSlice"),
  ...await import("./slices/userSlice"),
  ...await import("./slices/errorSlice")
});
const saved = (storage: Storage) => JSON.parse(storage.getItem("chesscam") ?? "null");

class FullStorage extends MemoryStorage {
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

  it("restores the saved user", async () => {
    storage.setItem("chesscam", JSON.stringify({ state: { user }, version: 0 }));
    const store = await loadStore();
    expect(store.getState().user).toEqual(user);
  });

  it("fills fields missing from the saved user", async () => {
    storage.setItem("chesscam", JSON.stringify({ state: { user: { token: "lip_abc" } }, version: 0 }));
    const store = await loadStore();
    expect(store.getState().user).toEqual({ token: "lip_abc", username: "" });
  });

  it("deletes Redux's saved state", async () => {
    storage.setItem("state", JSON.stringify({ user }));
    storage.setItem("persist:root", "{}");
    const store = await loadStore();
    expect(store.getState().user.token).toBe("");
    expect(storage.length).toBe(0);
  });

  it("falls back to initial state when saved state is corrupt", async () => {
    storage.setItem("chesscam", "{not json");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const store = await loadStore();
    expect(store.getState().user.token).toBe("");
  });

  it("saves only the user", async () => {
    await loadStore();
    const { errorShow, gameReset, userSet } = await loadSlices();
    userSet(user);
    gameReset("8/8/8/8/8/8/8/K6k w - - 0 1");
    errorShow({ source: "login", message: "Something failed" });
    expect(saved(storage)).toEqual({ state: { user }, version: 0 });
  });

  it("keeps working when localStorage is full", async () => {
    vi.stubGlobal("localStorage", new FullStorage());
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const store = await loadStore();
    (await loadSlices()).userSet(user);
    expect(store.getState().user).toEqual(user);
  });

  it("clears saved state", async () => {
    storage.setItem("chesscam", "{}");
    (await import("./store")).clearSavedState();
    expect(storage.length).toBe(0);
  });
});
