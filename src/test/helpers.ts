import { START_FEN } from "../utils/constants";
import type { Game } from "../types";

export const makeGame = (moves: string = "", start: string = START_FEN): Game => ({
  moves,
  fen: start,
  start,
  lastMove: "",
  greedy: false,
  fromOpponent: false,
  error: null,
  clock: null
});

// Node has no Web Storage, so tests stub localStorage/sessionStorage with this
export class MemoryStorage implements Storage {
  private items = new Map<string, string>();

  get length() {
    return this.items.size;
  }

  clear() {
    this.items.clear();
  }

  getItem(key: string) {
    return this.items.get(key) ?? null;
  }

  key(index: number) {
    return [...this.items.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.items.delete(key);
  }

  setItem(key: string, value: string) {
    this.items.set(key, value);
  }
}
