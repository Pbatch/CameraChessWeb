import { describe, expect, it } from "vitest";
import { replay } from "./replay";
import { videoProbs } from "../test/helpers";
import { START_FEN } from "../utils/constants";

const AFTER_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
const AFTER_E4_E5 = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
const FPS = 4;
const video = (...scenes: [string, number][]) => videoProbs(FPS, ...scenes);

describe("replay", () => {
  it("plays nothing while the board stays at the start", () => {
    expect(replay(video([START_FEN, 5]), FPS)).toEqual([]);
  });

  it("plays each move, timed from when it was first shown", () => {
    const moves = replay(video([START_FEN, 3], [AFTER_E4, 3], [AFTER_E4_E5, 3]), FPS);
    expect(moves.map(({ san }) => san)).toEqual(["e4", "e5"]);
    // e4 shows from 3s and e5 from 6s; a move can be shown from its first clear frame. e5 first has to confirm e4, so
    // it takes a frame or so longer.
    expect(moves[0].time).toBeGreaterThanOrEqual(3);
    expect(moves[0].time).toBeLessThanOrEqual(4);
    expect(moves[1].time).toBeGreaterThan(6);
    expect(moves[1].time).toBeLessThanOrEqual(7.5);
  });

  it("starts at the given time, timing moves from the video's start", () => {
    const moves = replay(video([AFTER_E4, 3], [START_FEN, 3], [AFTER_E4, 3]), FPS, 3);
    expect(moves.map(({ san }) => san)).toEqual(["e4"]);
    // From the video's start, not from the given time: e4 shows again from 6s
    expect(moves[0].time).toBeGreaterThanOrEqual(6);
  });

  it("skips frames with non-finite probabilities", () => {
    const probs = video([START_FEN, 3], [AFTER_E4, 3]);
    probs.fill(Number.NaN, 0, 64 * 13);
    expect(replay(probs, FPS).map(({ san }) => san)).toEqual(["e4"]);
  });
});
