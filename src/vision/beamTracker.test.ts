import { describe, expect, it } from "vitest";
import { BeamTracker, PLAY_BEAM_OPTIONS, PLAY_TRACKER_OPTIONS } from "./beamTracker";
import { BayesianTracker } from "./bayesianTracker";
import { makeUpdatePayload } from "../slices/gameSlice";
import { GameBoard } from "../chess/board";
import { replay, replayBeam } from "./replay";
import { makeGame, oneHotState, videoProbs } from "../test/helpers";
import { START_FEN } from "../utils/constants";
import type { Game } from "../types";

const AFTER_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
const AFTER_E4_E5 = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
const AFTER_D4 = "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1";
const AFTER_E4_E5_NF3 = "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2";
const FPS = 4;

const video = (...scenes: [string, number][]) => videoProbs(FPS, ...scenes);

const sans = (moves: { san: string }[]) => moves.map(({ san }) => san);

// A tracker, the game as the store would keep it, and the clock it runs on, in ms
interface Run { tracker: BeamTracker, game: Game, clock: number }
const start = (game: Game = makeGame()): Run => ({ tracker: new BeamTracker(), game, clock: 0 });

// Runs the tracker on frames of each FEN in turn
const run = (state: Run, ...scenes: [string, number][]): Run => {
  for (const [fen, seconds] of scenes) {
    for (let i = 0; i < seconds * FPS; i++) {
      const move = state.tracker.update(oneHotState(fen), state.clock, state.game);
      if (move !== null) state.game = { ...state.game, ...makeUpdatePayload(move.board) };
      state.clock += 1000 / FPS;
    }
  }
  return state;
}

describe("BeamTracker", () => {
  it("plays moves as the single tracker does", () => {
    const probs = video([START_FEN, 3], [AFTER_E4, 3], [AFTER_E4_E5, 3]);
    expect(sans(replayBeam(probs, FPS))).toEqual(["e4", "e5"]);
    expect(sans(replay(probs, FPS))).toEqual(["e4", "e5"]);
  });

  it("goes on from the app's game", () => {
    expect(run(start(makeGame("1. e4")), [AFTER_E4, 2], [AFTER_E4_E5, 3]).game.moves).toBe("1. e4 e5");
  });

  it("starts again when the game is changed elsewhere", () => {
    const state = run(start(), [START_FEN, 2], [AFTER_E4, 2], [AFTER_E4_E5, 3]);
    expect(state.game.moves).toBe("1. e4 e5");
    // The user takes back both moves, and the board shows the start again
    state.game = makeGame();
    expect(run(state, [START_FEN, 3]).game.moves).toBe("");
  });

  it("takes every move in a game changed elsewhere as final", () => {
    // The user entered 1. e4, but the board still shows the start
    expect(run(start(makeGame("1. e4")), [START_FEN, 3]).game.moves).toBe("1. e4");
  });

  it("can still replace a move shown just before a pause", () => {
    const state = run(start(), [START_FEN, 2], [AFTER_E4, 1]);
    expect(state.game.moves).toBe("1. e4");
    // Detection pauses, which stops the clock, and the board shows d4 once it starts again
    expect(run(state, [AFTER_D4, 3]).game.moves).toBe("1. d4");
  });

  it("goes on after a long gap in which the board was reset", () => {
    const state = run(start(), [START_FEN, 2], [AFTER_E4, 2], [AFTER_E4_E5, 3]);
    state.clock += 60000;
    run(state, [START_FEN, 3]);
    expect(state.game.moves).toBe("1. e4 e5");
    expect(run(state, [AFTER_E4_E5, 2], [AFTER_E4_E5_NF3, 3]).game.moves).toBe("1. e4 e5 2. Nf3");
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
    // Three frames: at 4 a second, a move held for a whole second (4 frames) is sent
    const probs = video([START_FEN, 3], [AFTER_E4, 0.75], [START_FEN, 4]);
    expect(sans(replay(probs, FPS, 0, new BayesianTracker(PLAY_TRACKER_OPTIONS)))).toEqual(["e4"]);
    expect(sans(replayBeam(probs, FPS, 0, new BeamTracker(PLAY_TRACKER_OPTIONS, PLAY_BEAM_OPTIONS)))).toEqual([]);
  });

  describe("in play mode, after the opponent's move comes from Lichess", () => {
    // 1. d4 Nf6 2. Nf3 d5 3. Bf4 e6 4. e3 c5 5. Nbd2, then Lichess sends 5... Nc6
    const board = new GameBoard(START_FEN);
    ["d2d4", "g8f6", "g1f3", "d7d5", "c1f4", "e7e6", "e2e3", "c7c5", "b1d2"].forEach((uci) => { board.playUci(uci); });
    const before = board.fen;
    board.playUci("b8c6");
    const after = board.fen;
    const fromLichess: Game = { ...makeGame(), ...makeUpdatePayload(board, true) };
    board.playUci("e3e4");
    const afterE4 = board.fen;
    const play = (): Run =>
      ({ tracker: new BeamTracker(PLAY_TRACKER_OPTIONS, PLAY_BEAM_OPTIONS), game: fromLichess, clock: 0 });

    it("sends nothing while the board still shows the position before it", () => {
      // Without waiting, 6. Bb8 Nxb8 explains the knight still on b8 and was sent
      const eager = { ...play(), tracker: new BeamTracker(PLAY_TRACKER_OPTIONS, { ...PLAY_BEAM_OPTIONS, waitForOpponent: false }) };
      expect(run(eager, [before, 10]).game.moves).toContain("6. Bb8");
      expect(run(play(), [before, 10]).game).toBe(fromLichess);
    });

    it("sends the user's move once the board shows the opponent's", () => {
      expect(run(play(), [before, 3], [after, 2], [afterE4, 3]).game.moves).toMatch(/Nc6 6\. e4$/);
    });

    it("sends the user's move when both are played at once", () => {
      expect(run(play(), [before, 3], [afterE4, 4]).game.moves).toMatch(/Nc6 6\. e4$/);
    });

    it("doesn't wait when the board already shows it", () => {
      expect(run(play(), [after, 2], [afterE4, 3]).game.moves).toMatch(/Nc6 6\. e4$/);
    });
  });
});
