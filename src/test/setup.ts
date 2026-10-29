import { beforeEach } from "vitest";
import { MemoryStorage } from "./helpers";

// Node has no Web Storage, and the store saves to localStorage on every change
globalThis.localStorage = new MemoryStorage();

beforeEach(() => {
  localStorage.clear();
});
