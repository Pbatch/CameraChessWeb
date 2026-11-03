import { describe, expect, it } from "vitest";
import { BeamTracker, PLAY_BEAM_OPTIONS, PLAY_TRACKER_OPTIONS } from "./beamTracker";
import { BayesianTracker } from "./bayesianTracker";
import { makeUpdatePayload } from "../slices/gameSlice";
import { replay, replayBeam } from "../dev/replay";
import { makeGame, modelProbs, oneHotState } from "../test/helpers";
import { START_FEN } from "../utils/constants";
import type { Game } from "../types";

const AFTER_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
const AFTER_E4_E5 = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
const FPS = 4;

// A video's model outputs: each FEN held for the given seconds
const video = (...scenes: [string, number][]): Float32Array => {
  const frames = scenes.flatMap(([fen, seconds]) => Array(seconds * FPS).fill(modelProbs(fen)));
  const probs = new Float32Array(frames.length * frames[0].length);
  frames.forEach((frame, i) => {
    probs.set(frame, i * frame.length);
  });
  return probs;
}

const sans = (moves: { san: string }[]) => moves.map(({ san }) => san);

// Runs the tracker on frames of each FEN in turn, from the given game, keeping the game as the store would
const run = (tracker: BeamTracker, game: Game, ...scenes: [string, number][]): Game => {
  let frame = 0;
  for (const [fen, seconds] of scenes) {
    for (let i = 0; i < seconds * FPS; i++, frame++) {
      const move = tracker.update(oneHotState(fen), 1000 * frame / FPS, game);
      if (move !== null) game = { ...game, ...makeUpdatePayload(move.board, move.greedy) };
    }
  }
  return game;
}

describe("BeamTracker", () => {
  it("plays moves as the single tracker does", () => {
    const probs = video([START_FEN, 3], [AFTER_E4, 3], [AFTER_E4_E5, 3]);
    expect(sans(replayBeam(probs, FPS))).toEqual(["e4", "e5"]);
    expect(sans(replay(probs, FPS))).toEqual(["e4", "e5"]);
  });

  it("goes on from the app's game", () => {
    const game = run(new BeamTracker(), makeGame("1. e4"), [AFTER_E4, 2], [AFTER_E4_E5, 3]);
    expect(game.moves).toBe("1. e4 e5");
  });

  it("starts again when the game is changed elsewhere", () => {
    const tracker = new BeamTracker();
    let game = run(tracker, makeGame(), [START_FEN, 2], [AFTER_E4, 2], [AFTER_E4_E5, 3]);
    expect(game.moves).toBe("1. e4 e5");
    // The user takes back both moves, and the board shows the start again
    game = run(tracker, { ...game, ...makeGame() }, [START_FEN, 3]);
    expect(game.moves).toBe("");
  });

  it("keeps a provisional move from before it started until it has something else to show", () => {
    const game = { ...makeGame("1. e4"), greedy: true };
    expect(run(new BeamTracker(), game, [START_FEN, 1])).toEqual(game);
    expect(run(new BeamTracker(), game, [AFTER_E4_E5, 3]).moves).toBe("1. e4 e5");
  });

  it("in play mode, sends only final moves, a second or so after they are played", () => {
    const moves = replayBeam(video([START_FEN, 3], [AFTER_E4, 3]), FPS, 0,
      new BeamTracker(PLAY_TRACKER_OPTIONS, PLAY_BEAM_OPTIONS));
    expect(sans(moves)).toEqual(["e4"]);
    const single = replay(video([START_FEN, 3], [AFTER_E4, 3]), FPS, 0, new BayesianTracker(PLAY_TRACKER_OPTIONS));
    expect(moves[0].time - single[0].time).toBeGreaterThan(0.5);
    expect(moves[0].time - single[0].time).toBeLessThanOrEqual(1.25);
  });

  it("in play mode, never sends a move shown for less than a second", () => {
    const probs = video([START_FEN, 3], [AFTER_E4, 1], [START_FEN, 4]);
    expect(sans(replay(probs, FPS, 0, new BayesianTracker(PLAY_TRACKER_OPTIONS)))).toEqual(["e4"]);
    expect(sans(replayBeam(probs, FPS, 0, new BeamTracker(PLAY_TRACKER_OPTIONS, PLAY_BEAM_OPTIONS)))).toEqual([]);
  });
});
