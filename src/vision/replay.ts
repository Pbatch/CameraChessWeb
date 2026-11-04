import { GameBoard } from "../chess/board";
import { getMovesPairs } from "../chess/moves";
import { toUpdate } from "./chessqueries";
import { BayesianTracker } from "./bayesianTracker";
import { BeamTracker } from "./beamTracker";
import type { Game, MovesPair } from "../types";
import { START_FEN } from "../utils/constants";

// Runs saved model outputs through the move tracking, frame by frame as findPieces does, for the tests and for
// scoring the tracking on recorded games (dev/replay.mjs, which is local only, as is the scoring in src/dev).

// The model's output per frame: 64 squares in FEN order, by 13 classes
const FRAME_SIZE: number = 64 * 13;

export interface TimedMove {
  uci: string,
  san: string,
  // When the move was first played, in seconds of video
  time: number
}

// Replays a video's model outputs, one frame per 1 / fps seconds, through a single BayesianTracker, from `start`
// seconds (when someone would start detection), and returns the game it would show at the end, with when each move
// was first played. This is how the app tracked moves before BeamTracker, kept to compare against (dev/replay.mjs
// --single): a provisional move is shown, but the tracker keeps looking from before it, so a different move can still
// replace it.
export const replay = (probs: Float32Array, fps: number, start: number = 0,
  tracker: BayesianTracker = new BayesianTracker()): TimedMove[] => {
  // The game the app shows
  let shown: TimedMove[] = [];
  // The board before any provisional move, and its pairs of moves
  const board = new GameBoard(START_FEN);
  let movesPairs: MovesPair[] = getMovesPairs(board.position);

  for (let i = Math.ceil(start * fps); i < probs.length / FRAME_SIZE; i++) {
    const update = toUpdate(probs.subarray(i * FRAME_SIZE, (i + 1) * FRAME_SIZE));
    if (!update.every((square) => square.every(Number.isFinite))) {
      continue;
    }
    const time = i / fps;
    const move = tracker.update(update, 1000 * time, { movesPairs, position: board.position });
    if (move === null) {
      continue;
    }
    board.playSan(move.san);
    shown = retime(shown, board.history.map(({ san }) => san), time);
    // A greedy move is shown, but the tracker keeps looking from before it, so a different move can still replace it
    if (move.greedy) {
      board.undo();
    } else {
      movesPairs = getMovesPairs(board.position);
    }
  }
  return shown;
}

// The game shown as `sans`, from what was shown before: moves kept from before keep their times, as in the game store,
// and the others are played at `time`
const retime = (shown: TimedMove[], sans: string[], time: number): TimedMove[] => {
  let kept = 0;
  while (kept < Math.min(shown.length, sans.length) && shown[kept].san === sans[kept]) {
    kept += 1;
  }
  const replayed = new GameBoard(START_FEN);
  return sans.map((san, index) => {
    const played = replayed.playSan(san);
    const uci = replayed.lastMove;
    if (played === null) {
      throw new Error(`Replayed an illegal move, ${san}`);
    }
    return { uci, san, time: (index < kept) ? shown[index].time : time };
  });
}

// As replay, but with the app's BeamTracker, as findPieces runs it: the game is kept as the store keeps it, and each
// game the tracker shows replaces it
export const replayBeam = (probs: Float32Array, fps: number, start: number = 0,
  tracker: BeamTracker = new BeamTracker()): TimedMove[] => {
  let shown: TimedMove[] = [];
  let game: Game = { moves: "", fen: START_FEN, start: START_FEN, lastMove: "", fromOpponent: false, times: [] };
  for (let i = Math.ceil(start * fps); i < probs.length / FRAME_SIZE; i++) {
    const update = toUpdate(probs.subarray(i * FRAME_SIZE, (i + 1) * FRAME_SIZE));
    if (!update.every((square) => square.every(Number.isFinite))) {
      continue;
    }
    const time = i / fps;
    const move = tracker.update(update, 1000 * time, game);
    if (move !== null) {
      const { board } = move;
      game = { ...game, moves: board.moves, fen: board.fen, lastMove: board.lastMove };
      shown = retime(shown, move.board.history.map(({ san }) => san), time);
    }
  }
  return shown;
}
