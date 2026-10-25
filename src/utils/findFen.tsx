import { invalidVideo } from "./detect";
import { runChessqueries } from "./chessqueries";
import { parseFen, makeFen } from "chessops/fen";
import { Chess } from "chessops/chess";
import type { Color, Role } from "chessops/types";
import { opposite } from "chessops/util";
import { PIECE_SYMBOLS, SQUARE_NAMES } from "./constants";
import { gameResetMoves, gameSetFen, gameSetStart } from "../slices/gameSlice";
import type { ModelRefs, Roi, SetStringArray, VideoRef } from "../types";
import type { Dispatch, UnknownAction } from "@reduxjs/toolkit";

interface FindFenInput {
  chessqueriesModelRef: ModelRefs["chessqueriesModelRef"],
  videoRef: VideoRef,
  roi: Roi | null,
  dispatch: Dispatch<UnknownAction>,
  setText: SetStringArray,
  color: Color
}

const getFenAndError = (pos: Chess, color: Color) => {
  const fen = makeFen(pos.toSetup());
  const otherColor: Color = opposite(color);

  let error = null;

  // Side to move has opponent in check
  const otherKing = pos.board.kingOf(otherColor);
  if (otherKing !== undefined) {
    if (pos.kingAttackers(otherKing, color, pos.board.occupied).nonEmpty()) {
      error = "Side to move has opponent in check";
      return { fen, error };
    }
  }

  return { fen, error };
}

const setFenFromState = (
  state: number[][],
  color: Color,
  dispatch: Dispatch<UnknownAction>,
  setText: SetStringArray
) => {
  const assignment = Array(64).fill(-1);

  // In the first pass, assign the black king
  let bestBlackKingScore = -1;
  let bestBlackKingIdx = -1;
  for (let i = 0; i < 64; i++) {
    const blackKingScore = state[i][1];
    if (blackKingScore > bestBlackKingScore) {
      bestBlackKingScore = blackKingScore;
      bestBlackKingIdx = i;
    }
  }
  assignment[bestBlackKingIdx] = 1;

  // In the second pass, assign the white king
  let bestWhiteKingScore = -1;
  let bestWhiteKingIdx = -1;
  for (let i = 0; i < 64; i++) {
    if (i === bestBlackKingIdx) {
      continue
    }
    const whiteKingScore = state[i][7];
    if (whiteKingScore > bestWhiteKingScore) {
      bestWhiteKingScore = whiteKingScore;
      bestWhiteKingIdx = i;
    }
  }
  assignment[bestWhiteKingIdx] = 7;

  // In the third pass, assign the remaining pieces
  const remainingPieceIdxs = [0, 2, 3, 4, 5, 6, 8, 9, 10, 11];
  for (let i = 0; i < 64; i++) {
    // Square has already been assigned
    if (assignment[i] !== -1) {
      continue
    }

    let bestIdx = null;
    let bestScore = 0.3;
    remainingPieceIdxs.forEach(j => {
      const squareName = SQUARE_NAMES[i];
      const badRank: boolean = (squareName[1] === "1") || (squareName[1] === "8");
      const isPawn: boolean = (PIECE_SYMBOLS[j % 6] === "pawn");
      if (isPawn && badRank) {
        return;
      }

      const score = state[i][j];
      if (score > bestScore) {
        bestIdx = j;
        bestScore = score;
      }
    });

    if (bestIdx !== null) {
      assignment[i] = bestIdx;
    }
  }

  // chessops rejects an entirely empty position, so start from a legal board
  // before replacing its pieces with the detected assignment.
  const turn = color === "white" ? "w" : "b";
  const setup = parseFen(`4k3/8/8/8/8/8/8/4K3 ${turn} - - 0 1`).unwrap();
  const board = Chess.fromSetup(setup).unwrap();
  board.board.clear();
  for (let i = 0; i < 64; i++) {
    if (assignment[i] === -1) {
      continue;
    }
    const role: Role = PIECE_SYMBOLS[assignment[i] % 6];
    const pieceColor: Color = (assignment[i] > 5) ? 'white' : 'black';
    board.board.set(i, { role, color: pieceColor });
  }

  const { fen, error } = getFenAndError(board, color);
  if (error === null) {
    dispatch(gameSetStart(fen));
    dispatch(gameSetFen(fen));
    dispatch(gameResetMoves());
    setText(["Set starting FEN"]);
  } else {
    setText(["Invalid FEN:", error]);
  }
}

export const findFen = async ({ chessqueriesModelRef, videoRef, roi,
  dispatch, setText, color }: FindFenInput) => {
  if (invalidVideo(videoRef)) {
    return;
  }
  const { update } = await runChessqueries(chessqueriesModelRef, videoRef, roi);
  setFenFromState(update, color, dispatch, setText);
}
