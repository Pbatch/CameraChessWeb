import { parseFen } from "chessops/fen";
import { EMPTY, NUM_LABELS, START_FEN, pieceToLabel } from "../utils/constants";
import { zeros } from "../utils/math";
import type { Game } from "../types";

export const makeGame = (moves: string = "", start: string = START_FEN): Game => ({
  moves,
  fen: start,
  start,
  lastMove: "",
  greedy: false,
  fromOpponent: false,
  clock: null
});

// A 64x13 state in square order (a1..h8) that is certain of every square in the FEN
export const oneHotState = (fen: string): number[][] => {
  const board = parseFen(fen).unwrap().board;
  const state: number[][] = zeros(64, NUM_LABELS);
  for (let i = 0; i < 64; i++) {
    const piece = board.get(i);
    state[i][(piece === undefined) ? EMPTY : pieceToLabel(piece)] = 1;
  }
  return state;
}

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
