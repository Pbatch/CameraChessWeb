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
  times: []
});

// How sure the fake model is of each square. Like the real model, never certain: a certain frame is only held back by
// the tracker's floor, so at a high temperature it would count for far more than any real frame.
const SURE = 0.999;
const UNSURE = (1 - SURE) / (NUM_LABELS - 1);

// A 64x13 state in square order (a1..h8) that is sure of every square in the FEN
export const oneHotState = (fen: string): number[][] => {
  const board = parseFen(fen).unwrap().board;
  const state: number[][] = zeros(64, NUM_LABELS).map((row) => row.fill(UNSURE));
  for (let i = 0; i < 64; i++) {
    const piece = board.get(i);
    state[i][(piece === undefined) ? EMPTY : pieceToLabel(piece)] = SURE;
  }
  return state;
}

// The model's classes, in output order
export const MODEL_CLASSES = ".PNBRQKpnbrqk";

// The model's output for a FEN it is sure of: one row per square in FEN order (a8..h1)
export const modelProbs = (fen: string): Float32Array => {
  const symbols: string = fen.split(" ")[0].replace(/\d/g, (n) => ".".repeat(Number(n))).replace(/\//g, "");
  const probs = new Float32Array(64 * MODEL_CLASSES.length).fill(UNSURE);
  [...symbols].forEach((symbol, i) => {
    probs[i * MODEL_CLASSES.length + MODEL_CLASSES.indexOf(symbol)] = SURE;
  });
  return probs;
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
