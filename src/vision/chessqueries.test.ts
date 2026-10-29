import { describe, expect, it } from "vitest";
import { getOrientation, toDirection, toUpdate } from "./chessqueries";
import { LABEL_MAP, NUM_LABELS, SQUARE_MAP } from "../utils/constants";
import { oneHotState } from "../test/helpers";

// The model's classes, in output order
const MODEL_CLASSES = ".PNBRQKpnbrqk";
// Asymmetric in both ranks and files, so a flip or transpose would show
const ITALIAN = "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4";

// The model's output for a FEN it is certain of: one row per square in FEN order (a8..h1)
const modelProbs = (fen: string): Float32Array => {
  const symbols: string = fen.split(" ")[0].replace(/\d/g, (n) => ".".repeat(Number(n))).replace(/\//g, "");
  const probs = new Float32Array(64 * MODEL_CLASSES.length);
  [...symbols].forEach((symbol, i) => {
    probs[i * MODEL_CLASSES.length + MODEL_CLASSES.indexOf(symbol)] = 1;
  });
  return probs;
}

// Square centroids in FEN order, in pixels, for a board of 50px squares centred on (cx, cy)
// and turned clockwise by quarter turns on screen. Pulled towards the centre by `pull`, like the model's.
const centroidsFor = (turns: number, width: number, height: number, pull: number = 0) => {
  const centroids = new Float32Array(64 * 2);
  for (let i = 0; i < 64; i++) {
    let dx: number = ((i % 8) - 3.5) * 50 * (1 - pull);
    let dy: number = (Math.floor(i / 8) - 3.5) * 50 * (1 - pull);
    for (let t = 0; t < turns; t++) {
      [dx, dy] = [-dy, dx];
    }
    centroids[2 * i] = (width / 2 + dx) / width;
    centroids[2 * i + 1] = (height / 2 + dy) / height;
  }
  return centroids;
}

describe("toUpdate", () => {
  it("turns FEN order into square order", () => {
    expect(toUpdate(modelProbs(ITALIAN))).toEqual(oneHotState(ITALIAN));
  });

  it("maps each model class to its label", () => {
    const probs = Float32Array.from({ length: 64 * MODEL_CLASSES.length }, (_, k) => k);
    const update = toUpdate(probs);
    expect(update).toHaveLength(64);
    expect(update[0]).toHaveLength(NUM_LABELS);
    // a8 is the first row, h1 the last
    expect(update[SQUARE_MAP.a8][LABEL_MAP["."]]).toBe(0);
    expect(update[SQUARE_MAP.a8][LABEL_MAP.P]).toBe(1);
    expect(update[SQUARE_MAP.h8][LABEL_MAP.k]).toBe(7 * 13 + 12);
    expect(update[SQUARE_MAP.a1][LABEL_MAP.K]).toBe(56 * 13 + 6);
    expect(update[SQUARE_MAP.h1][LABEL_MAP.b]).toBe(63 * 13 + 9);
  });
});

describe("getOrientation", () => {
  it.each([
    [[0, -1], ["a8", "h8", "h1", "a1"]],
    [[1, 0], ["a1", "a8", "h8", "h1"]],
    [[0, 1], ["h1", "a1", "a8", "h8"]],
    [[-1, 0], ["h8", "h1", "a1", "a8"]],
  ])("puts rank 8 towards %j as %j", (direction, corners) => {
    expect(getOrientation(direction)).toEqual(corners);
  });

  it("rounds to the nearest quarter turn", () => {
    expect(getOrientation([0.9, -1])).toEqual(["a8", "h8", "h1", "a1"]);
    expect(getOrientation([1, -0.9])).toEqual(["a1", "a8", "h8", "h1"]);
    expect(getOrientation([-0.9, -1])).toEqual(["a8", "h8", "h1", "a1"]);
    expect(getOrientation([-1, -0.9])).toEqual(["h8", "h1", "a1", "a8"]);
  });

  it("doesn't depend on the direction's length", () => {
    expect(getOrientation([0, -0.01])).toEqual(getOrientation([0, -100]));
  });
});

describe("toDirection", () => {
  it.each([
    [0, [0, -1], ["a8", "h8", "h1", "a1"]],
    [1, [1, 0], ["a1", "a8", "h8", "h1"]],
    [2, [0, 1], ["h1", "a1", "a8", "h8"]],
    [3, [-1, 0], ["h8", "h1", "a1", "a8"]],
  ])("points to rank 8 on a board turned %i quarter turns clockwise", (turns, rank8, corners) => {
    // A 16:9 frame, so the board only stays square if x and y are scaled separately
    const direction = toDirection(centroidsFor(turns, 1600, 900, 0.5), 1600, 900);
    expect(direction[0] / 2).toBeCloseTo(rank8[0]);
    expect(direction[1] / 2).toBeCloseTo(rank8[1]);
    expect(getOrientation(direction)).toEqual(corners);
  });

  it("uses the files alone when the ranks collapse together", () => {
    const centroids = centroidsFor(1, 1000, 1000);
    // Every rank's centroid on rank 4.5, so only the a->h direction is left
    for (let i = 0; i < 64; i++) {
      centroids[2 * i] = 0.5;
    }
    const direction = toDirection(centroids, 1000, 1000);
    expect(direction[0]).toBeCloseTo(1);
    expect(direction[1]).toBeCloseTo(0);
  });

  it("doesn't return NaN for degenerate centroids", () => {
    expect(toDirection(new Float32Array(128).fill(0.5), 100, 100)).toEqual([0, 0]);
  });
});
