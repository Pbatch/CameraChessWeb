import i18n from "../i18n";
import { invalidVideo } from "./detect";
import { runPieceModel } from "./pieceModel";
import { makeFen } from "chessops/fen";
import { Chess, IllegalSetup } from "chessops/chess";
import { emptySetup } from "chessops/setup";
import { Board } from "chessops/board";
import type { Color } from "chessops/types";
import { EMPTY, LABEL_MAP, NUM_LABELS, PIECE_SYMBOLS, labelToPiece } from "../utils/constants";
import { zeros } from "../utils/math";
import { gameReset } from "../slices/gameSlice";
import type { ModelRefs, Roi, SetStringArray, VideoRef } from "../types";

interface FindFenInput {
  modelRef: ModelRefs["modelRef"],
  videoRef: VideoRef,
  roi: Roi | null,
  setText: SetStringArray,
  color: Color
}

const SETUP_ERRORS = {
  [IllegalSetup.Empty]: "position.errors.empty",
  [IllegalSetup.Kings]: "position.errors.kings",
  [IllegalSetup.OppositeCheck]: "position.errors.oppositeCheck",
  [IllegalSetup.PawnsOnBackrank]: "position.errors.pawnsOnBackrank"
} as const;

const NUM_FRAMES: number = 3;
const BLACK_KING: number = LABEL_MAP.k;
const WHITE_KING: number = LABEL_MAP.K;
// Kings are placed separately, so every board has exactly one of each
const OTHER_PIECES: number[] = Array.from({ length: NUM_LABELS }, (_, j) => j)
  .filter(j => j !== EMPTY && j !== BLACK_KING && j !== WHITE_KING);

// The two squares the model rates highest for the label, best first
const topTwoSquares = (state: number[][], label: number): [number, number] => {
  let first = -1;
  let second = -1;
  for (let i = 0; i < 64; i++) {
    if (first === -1 || state[i][label] > state[first][label]) {
      second = first;
      first = i;
    } else if (second === -1 || state[i][label] > state[second][label]) {
      second = i;
    }
  }
  return [first, second];
}

// King squares with the highest combined score. Only a shared best square needs
// a runner-up, so the best pair always uses each king's best or second best square.
export const kingSquares = (state: number[][]): [number, number] => {
  const [black1, black2] = topTwoSquares(state, BLACK_KING);
  const [white1, white2] = topTwoSquares(state, WHITE_KING);
  if (black1 !== white1) {
    return [black1, white1];
  }
  const blackMoves: number = state[black2][BLACK_KING] + state[white1][WHITE_KING];
  const whiteMoves: number = state[black1][BLACK_KING] + state[white2][WHITE_KING];
  return (blackMoves > whiteMoves) ? [black2, white1] : [black1, white2];
}

// Model state -> most likely board, with exactly one king per side
export const stateToBoard = (state: number[][]): Board => {
  const board = Board.empty();

  const [blackKing, whiteKing] = kingSquares(state);
  board.set(blackKing, labelToPiece(BLACK_KING));
  board.set(whiteKing, labelToPiece(WHITE_KING));

  // Then assign the remaining pieces
  for (let i = 0; i < 64; i++) {
    // Square has already been assigned
    if (board.has(i)) {
      continue
    }

    const backRank: boolean = (i < 8) || (i >= 56);

    // A piece is only placed if the model rates it above an empty square
    let bestIdx = null;
    let bestScore = state[i][EMPTY];
    OTHER_PIECES.forEach(j => {
      if (backRank && (PIECE_SYMBOLS[j % 6] === "pawn")) {
        return;
      }

      const score = state[i][j];
      if (score > bestScore) {
        bestIdx = j;
        bestScore = score;
      }
    });

    if (bestIdx !== null) {
      board.set(i, labelToPiece(bestIdx));
    }
  }

  return board;
}

export const findFen = async ({ modelRef, videoRef, roi,
  setText, color }: FindFenInput) => {
  if (invalidVideo(videoRef)) {
    return;
  }
  // Averaged over a few frames, so one blurry frame does not decide the position
  const average: number[][] = zeros(64, NUM_LABELS);
  for (let frame = 0; frame < NUM_FRAMES; frame++) {
    if (frame > 0) {
      await new Promise(requestAnimationFrame);
    }
    const { update } = await runPieceModel(modelRef, videoRef, roi);
    for (let i = 0; i < 64; i++) {
      for (let j = 0; j < NUM_LABELS; j++) {
        average[i][j] += update[i][j] / NUM_FRAMES;
      }
    }
  }

  const setup = emptySetup();
  setup.board = stateToBoard(average);
  setup.turn = color;

  const pos = Chess.fromSetup(setup);
  if (pos.isErr) {
    const key = SETUP_ERRORS[pos.error.message as keyof typeof SETUP_ERRORS];
    setText([i18n.t("position.invalid"), (key === undefined) ? pos.error.message : i18n.t(key)]);
    return;
  }

  const fen = makeFen(setup);
  gameReset(fen);
  setText([i18n.t("position.set")]);
}
