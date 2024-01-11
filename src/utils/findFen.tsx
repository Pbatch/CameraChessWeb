import * as tf from "@tensorflow/tfjs-core";
import { getInvTransform, transformBoundary, transformCenters } from "./warp";
import { invalidVideo } from "./detect";
import { detect, getKeypoints, getSquares, getUpdate} from "./findPieces";
import { Chess, Color, Piece, PieceSymbol, Square } from "chess.js";
import { PIECE_SYMBOLS, SQUARE_NAMES } from "./constants";
import { gameResetPgnAndFen, gameSetStart } from "../slices/gameSlice";
import { renderBoxes } from "./render/renderBox";
import { setStringArray } from "../types";

const getFenAndError = (board: Chess, color: Color) => {
  let fen = board.fen();
  const otherColor: Color = (color === "w") ? "b" : "w";
  fen = fen.replace(` ${otherColor} `, ` ${color} `);

  let error = null;

  // Side to move has opponent in check
  for (let i = 0; i < 64; i++) {
    const square: Square = SQUARE_NAMES[i];
    const piece: Piece = board.get(square);

    const isKing: boolean = (piece.type === "k");
    const isOtherColor: boolean = (piece.color === otherColor);
    const isAttacked: boolean = board.isAttacked(square, color);

    if (isKing && isOtherColor && isAttacked) {
      error = "Side to move has opponent in check";
      return {fen, error}
    }
  }

  return {fen, error}
}

const setFenFromState = (state: number[][], color: Color, dispatch: any, setText: setStringArray) => {
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
    if (i == bestBlackKingIdx) {
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
      const square: Square = SQUARE_NAMES[i];
      const badRank: boolean = (square[1] === "1") || (square[1] === "8");
      const isPawn: boolean = (PIECE_SYMBOLS[j % 6] === "p");
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

  const board = new Chess();
  board.clear();
  for (let i = 0; i < 64; i++) {
    if (assignment[i] === -1) {
      continue;
    }
    const piece: PieceSymbol = PIECE_SYMBOLS[assignment[i] % 6];
    const color: Color = (assignment[i] > 5) ? 'w' : 'b';
    const square: Square = SQUARE_NAMES[i];
    board.put({'type': piece, 'color': color}, square);
  }

  const {fen, error} = getFenAndError(board, color);
  if (error === null) {
    dispatch(gameSetStart(fen));
    dispatch(gameResetPgnAndFen());
    setText(["Set starting FEN"]);
  } else {
    setText(["Invalid FEN:", error]);
  }
}

export const _findFen = async (modelRef: any, videoRef: any, 
  cornersRef: any, canvasRef: any, dispatch: any, setText: any, color: Color) => {
  if (invalidVideo(videoRef)) {
    return;
  }
  const keypoints: number[][] = getKeypoints(cornersRef, canvasRef);
  
  const invTransform = getInvTransform(keypoints);
  const centers = transformCenters(invTransform);
  const boundary = transformBoundary(invTransform);
  const {boxes, scores} = await detect(modelRef, videoRef, keypoints);
  const squares: number[] = getSquares(boxes, centers, boundary);
  const state = getUpdate(scores, squares);
  setFenFromState(state, color, dispatch, setText);

  renderBoxes(canvasRef.current, boxes, scores, centers, boundary, squares);

  tf.dispose([boxes, scores]);
}

export const findFen = async (piecesModelRef: any, videoRef: any, cornersRef: any, canvasRef: any,
   dispatch: any, setText: any, color: Color) => {
  const startTensors = tf.memory().numTensors;

  await _findFen(piecesModelRef, videoRef, cornersRef, canvasRef, dispatch, setText, color);

  const endTensors = tf.memory().numTensors;
  if (startTensors < endTensors) {
    console.error(`Memory Leak! (${endTensors} > ${startTensors})`)
  }

  return () => {
    tf.disposeVariables();
  };
}