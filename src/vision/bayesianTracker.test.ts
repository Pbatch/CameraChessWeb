import { describe, expect, it } from "vitest";
import { BayesianTracker, type TrackerMove } from "./bayesianTracker";
import { getMovesPairs } from "../chess/moves";
import { replay } from "./replay";
import { makeBoard } from "../slices/gameSlice";
import { EMPTY, LABEL_MAP, NUM_LABELS, SQUARE_MAP, START_FEN } from "../utils/constants";
import { makeGame, modelProbs, oneHotState } from "../test/helpers";

const AFTER_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
const AFTER_E4_E5 = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
const AFTER_C4 = "rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1";
const AFTER_D4_D5 = "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2";
const FPS = 4;

// Model outputs for frames of each FEN in turn
const video = (...scenes: [string, number][]): Float32Array => {
  const frames = scenes.flatMap(([fen, count]) => Array(count).fill(modelProbs(fen)));
  const probs = new Float32Array(frames.length * frames[0].length);
  frames.forEach((frame, i) => {
    probs.set(frame, i * frame.length);
  });
  return probs;
}

const sans = (probs: Float32Array) => replay(probs, FPS, 0, new BayesianTracker()).map(({ san }) => san);

describe("BayesianTracker", () => {
  it("plays nothing while the board stays at the start", () => {
    expect(sans(video([START_FEN, 20]))).toEqual([]);
  });

  it("plays a clear move within about a second", () => {
    const moves = replay(video([START_FEN, 4], [AFTER_E4, 12]), FPS, 0, new BayesianTracker());
    expect(moves.map(({ san }) => san)).toEqual(["e4"]);
    // The move shows from 1s
    expect(moves[0].time).toBeLessThanOrEqual(2);
  });

  it("plays a clear move about as soon at 2 frames a second, as its settings are per second", () => {
    // e4 from 1s, at 4 and at 2 frames a second
    const at4 = replay(video([START_FEN, 4], [AFTER_E4, 12]), 4, 0, new BayesianTracker());
    const at2 = replay(video([START_FEN, 2], [AFTER_E4, 6]), 2, 0, new BayesianTracker());
    expect(at2.map(({ san }) => san)).toEqual(["e4"]);
    expect(Math.abs(at2[0].time - at4[0].time)).toBeLessThanOrEqual(0.5);
  });

  it("plays a move and its reply", () => {
    expect(sans(video([START_FEN, 4], [AFTER_E4, 12], [AFTER_E4_E5, 12]))).toEqual(["e4", "e5"]);
    // Both at once, as when the reply is quick
    expect(sans(video([START_FEN, 4], [AFTER_E4_E5, 12]))).toEqual(["e4", "e5"]);
  });

  it("replaces a move that is put down and taken back", () => {
    // Evidence doesn't fade, so 3s of c4 takes about 4s back at the start to unwind
    expect(sans(video([START_FEN, 4], [AFTER_C4, 12], [START_FEN, 16], [AFTER_D4_D5, 20]))).toEqual(["d4", "d5"]);
  });

  it("ignores a single frame of another position", () => {
    expect(sans(video([START_FEN, 4], [AFTER_E4_E5, 1], [START_FEN, 12]))).toEqual([]);
  });

  const game = () => {
    const board = makeBoard(makeGame());
    return { movesPairs: getMovesPairs(board.position), position: board.position };
  }

  // The moves the tracker returns over frames of a FEN, from the start position
  const returned = (tracker: BayesianTracker, fen: string) => {
    const g = game();
    return Array.from({ length: 40 }, (_, i) => tracker.update(oneHotState(fen), 250 * i, g)).filter((move) => move !== null);
  }

  it("shows a move provisionally until its reply is seen", () => {
    expect(returned(new BayesianTracker(), AFTER_E4)).toEqual([{ san: "e4", greedy: true }]);
    // A move with its reply is shown first, then played for good
    expect(returned(new BayesianTracker(), AFTER_E4_E5)).toEqual([{ san: "e4", greedy: true }, { san: "e4", greedy: false }]);
  });

  it("plays a move for good straight away without provisional moves", () => {
    expect(returned(new BayesianTracker({ provisional: false }), AFTER_E4)).toEqual([{ san: "e4", greedy: false }]);
  });

  it("does not play a move whose destination the frames don't show", () => {
    // e2 is empty, but the pawn is as likely on e3 as on e4
    const frame = oneHotState(START_FEN);
    frame[SQUARE_MAP.e2] = Array(NUM_LABELS).fill(0);
    frame[SQUARE_MAP.e2][EMPTY] = 1;
    for (const square of [SQUARE_MAP.e3, SQUARE_MAP.e4]) {
      frame[square] = Array(NUM_LABELS).fill(0);
      frame[square][EMPTY] = 0.5;
      frame[square][LABEL_MAP.P] = 0.5;
    }
    const tracker = new BayesianTracker();
    const g = game();
    for (let i = 0; i < 40; i++) {
      expect(tracker.update(frame, 250 * i, g)).toBeNull();
    }
  });

  // A frame as the model gives it when it reads the board turned half way round
  const turned = (fen: string) => oneHotState(fen).reverse();

  it("ignores frames read turned round", () => {
    // Turned round, the king on d4 shows on e5, as if it had moved there
    const fen = "7k/8/8/8/3K4/8/8/8 w - - 0 1";
    const board = makeBoard(makeGame("", fen));
    const g = { movesPairs: getMovesPairs(board.position), position: board.position };
    const tracker = new BayesianTracker();
    for (let i = 0; i < 40; i++) {
      expect(tracker.update(turned(fen), 250 * i, g)).toBeNull();
    }
  });

  it("plays a move among frames read turned round", () => {
    const tracker = new BayesianTracker();
    const g = game();
    const moves = Array.from({ length: 40 }, (_, i) =>
      tracker.update((i % 3 === 0) ? oneHotState(AFTER_E4) : turned(AFTER_E4), 250 * i, g)).filter((move) => move !== null);
    expect(moves).toEqual([{ san: "e4", greedy: true }]);
  });

  it("plays a promotion as a queen when the frames can't tell which piece, though its reply takes it", () => {
    // Once the rook takes on e8, no square shows which piece the pawn became
    const before = "r5k1/4P3/8/8/8/8/8/7K w - - 0 1";
    const after = "4r1k1/8/8/8/8/8/8/7K w - - 0 2";
    // The new piece read as any of the four, as when the model can't tell an upside-down rook from a queen
    const promoted = oneHotState("r3Q1k1/8/8/8/8/8/8/7K b - - 0 1");
    promoted[SQUARE_MAP.e8] = Array(NUM_LABELS).fill(0);
    for (const label of ["Q", "R", "B", "N"]) promoted[SQUARE_MAP.e8][LABEL_MAP[label]] = 0.25;
    const frame = (i: number) => (i < 8) ? oneHotState(before) : (i < 16) ? promoted : oneHotState(after);
    const board = makeBoard(makeGame("", before));
    const tracker = new BayesianTracker();
    const played: string[] = [];
    let shown = null;
    let g = { movesPairs: getMovesPairs(board.position), position: board.position };
    for (let i = 0; i < 48; i++) {
      const move = tracker.update(frame(i), 250 * i, g);
      if (move?.greedy) {
        shown = move.san;
      } else if (move !== null) {
        played.push(move.san);
        board.playSan(move.san);
        g = { movesPairs: getMovesPairs(board.position), position: board.position };
      }
    }
    // The reply is shown, but only played for good once White's next move is seen
    expect(played).toEqual(["e8=Q+"]);
    expect(shown).toBe("Rxe8");
  });

  it("plays checkmate for good without waiting for a reply", () => {
    // Fool's mate, then the queen moved on to g5 as the board is cleared, which was a legal move instead of the mate
    const before = "rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2";
    const mate = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";
    const cleared = "rnb1kbnr/pppp1ppp/8/4p1q1/6P1/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";
    let board = makeBoard(makeGame("", before));
    const tracker = new BayesianTracker();
    const moves: TrackerMove[] = [];
    let g = { movesPairs: getMovesPairs(board.position), position: board.position };
    for (let i = 0; i < 48; i++) {
      const fen = (i < 8) ? before : (i < 24) ? mate : cleared;
      const move = tracker.update(oneHotState(fen), 250 * i, g);
      if (move === null) continue;
      moves.push(move);
      if (!move.greedy) {
        board = makeBoard(makeGame(move.san, before));
        g = { movesPairs: getMovesPairs(board.position), position: board.position };
      }
    }
    expect(moves).toEqual([{ san: "Qh4#", greedy: false }]);
  });

  it("takes uncertain frames as no evidence", () => {
    const uniform = Array.from({ length: 64 }, () => Array(NUM_LABELS).fill(1 / NUM_LABELS));
    const tracker = new BayesianTracker();
    const g = game();
    for (let i = 0; i < 40; i++) {
      expect(tracker.update(uniform, 250 * i, g)).toBeNull();
    }
  });
});
