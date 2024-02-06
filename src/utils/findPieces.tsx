import { renderBoxes } from "./render/renderBox";
import * as tf from "@tensorflow/tfjs-core";
import { getMovesPairs } from "./moves";
import { getInvTransform, transformBoundary, transformCenters } from "./warp";
import { Chess } from 'chess.js';
import { gameSetFen, gameSetMoves, makePgn } from "../slices/gameSlice";
import { getBoxesAndScores, getInput, getXY, invalidVideo } from "./detect";
import {  MovesData, MovesPair } from "../types";
import { zeros } from "./math";
import { CORNER_KEYS, LABELS } from "./constants";

const calculateScore = (state: any, move: MovesData, from_thr=0.6, to_thr=0.6) => {
  let score = 0;
  move.from.forEach(square => {
    score += 1 - Math.max(...state[square]) - from_thr;
  })

  for (let i = 0; i < move.to.length; i++) {
    score += state[move.to[i]][move.targets[i]] - to_thr;
  }

  return score
}

const processState = (state: any, movesPairs: MovesPair[], possibleMoves: Set<string>): {
  bestScore1: number, bestScore2: number, bestJointScore: number, 
  bestMove: MovesData | null, bestMoves: MovesData | null
} => {
  let bestScore1 = Number.NEGATIVE_INFINITY;
  let bestScore2 = Number.NEGATIVE_INFINITY;
  let bestJointScore = Number.NEGATIVE_INFINITY;
  let bestMove: MovesData | null = null;
  let bestMoves: MovesData | null = null;
  const seen: Set<string> = new Set();

  movesPairs.forEach(movePair => {
    if (!(movePair.move1.sans[0] in seen)) {
      seen.add(movePair.move1.sans[0]);
      const score = calculateScore(state, movePair.move1);
      if (score > 0) {
        possibleMoves.add(movePair.move1.sans[0]);
      }
      if (score > bestScore1) {
        bestMove = movePair.move1;
        bestScore1 = score;
      }
    }

    if ((movePair.move2 === null) || (movePair.moves === null) || !(possibleMoves.has(movePair.move1.sans[0]))) {
      return;
    }
    
    const score2: number = calculateScore(state, movePair.move2);
    if (score2 < 0) {
      return;
    } else if (score2 > bestScore2) {
      bestScore2 = score2;
    }

    const jointScore: number = calculateScore(state, movePair.moves);
    if (jointScore > bestJointScore) {
      bestJointScore = jointScore;
      bestMoves = movePair.moves;
    }
  })

  return {bestScore1, bestScore2, bestJointScore, bestMove, bestMoves};
}

export const getSquares = (boxes: tf.Tensor2D, centers: number[][], boundary: number[][]): number[] => {
  const squares: number[] = tf.tidy(() => {
    const l: tf.Tensor2D = tf.slice(boxes, [0, 0], [-1, 1]);
    const r: tf.Tensor2D = tf.slice(boxes, [0, 2], [-1, 1]);
    const b: tf.Tensor2D = tf.slice(boxes, [0, 3], [-1, 1]);
    const cx: tf.Tensor2D = tf.div(tf.add(l, r), 2);
    const cy: tf.Tensor2D = tf.sub(b, tf.div(tf.sub(r, l), 3));
    const boxCentersTensor: tf.Tensor2D = tf.concat([cx, cy], 1);
    const dist: tf.Tensor2D = tf.sum(tf.square(tf.sub(tf.expandDims(boxCentersTensor, 1), 
    tf.expandDims(tf.tensor2d(centers), 0))), 2);
    const squaresTensor: tf.Tensor1D = tf.argMin(dist, 1)
    
    const squares: number[] = squaresTensor.arraySync();
    const boxCenters: number[][] = boxCentersTensor.arraySync();
    for (let i: number = 0; i < squares.length; i++) {
      for (let j: number = 0; j < 4; j++) {
        const jplus: number = (j + 1) % 4;
        const a: number = boundary[j][0] - boundary[jplus][0];
        const b: number = boundary[j][1] - boundary[jplus][1];
        const c: number = boxCenters[i][0] - boundary[jplus][0];
        const d: number = boxCenters[i][1] - boundary[jplus][1];
        const det: number = (a * d) - (b * c);
        if (det < 0) {
          squares[i] = -1;
        }
      }
    }
    return squares;
  });

  return squares;
}

export const getPossiblePieces = (movesPairs: MovesPair[]) => {
  const possiblePieces: number[][] = zeros(64, 12);
  movesPairs.forEach((movePair: MovesPair) => {
    
    const move1 = movePair.move1;
    possiblePieces[move1.to[0]][move1.targets[0]] = 1;
    
    const move2 = movePair.move2;
    if (move2 !== null) {
      possiblePieces[move2.to[0]][move2.targets[0]] = 1;
    } 
  })

  return possiblePieces;
}

export const getUpdate = (scoresTensor: tf.Tensor2D, squares: number[], possiblePieces: number[][]) => {
  const update: number[][] = zeros(64, 12);
  const scores: number[][] = scoresTensor.arraySync();

  // If a piece can't be on a square, because of move constraints, map it's probability to its neighbour
  // Bishops give their probability to Pawns, Kings give their probability to Queens
  const neighbourMap: {[cls: string]: string} = {
    "b": "p", 
    "p": "b",
    "q": "k", 
    "k": "q",
    "n": "n",
    "r": "r",
    "B": "P", 
    "P": "B",
    "K": "Q", 
    "Q": "K",
    "N": "N",
    "R": "R"
  }
  squares.forEach((square, i) => {
    if (square == -1) {
      return;
    }
    for (let j = 0; j < 12; j++) {
      const cls: number = (possiblePieces[square][j] === 0) ? LABELS.indexOf(neighbourMap[LABELS[j]]) : j;

      if (possiblePieces[square][cls] === 0) {
        continue;
      }
      
      update[square][cls] = Math.max(update[square][cls], scores[i][j]);
    }
  })
  return update;
}

const updateState = (state: number[][], update: number[][], decay: number=0.5) => {
  for (let i = 0; i < 64; i++) {
    for (let j = 0; j < 12; j++) {
      state[i][j] = decay * state[i][j] + (1 - decay) * update[i][j]
    }
  }
  return state
}

export const detect = async (modelRef: any, videoRef: any, keypoints: number[][]):
  Promise<{boxes: tf.Tensor2D, scores: tf.Tensor2D}> => {
  const {image4D, width, height, padding, roi} = getInput(videoRef, keypoints);
  const videoWidth: number = videoRef.current.videoWidth;
  const videoHeight: number = videoRef.current.videoHeight;
  const preds: tf.Tensor3D = modelRef.current.predict(image4D);
  const {boxes, scores} = getBoxesAndScores(preds, width, height, videoWidth, videoHeight, padding, roi);

  tf.dispose([image4D, preds]);

  return {boxes, scores}
}

export const getKeypoints = (cornersRef: any, canvasRef: any): number[][] => {
  const keypoints = CORNER_KEYS.map(x =>
    getXY(cornersRef.current[x], canvasRef.current.height, canvasRef.current.width)
  );
  return keypoints
}

export const findPieces = (modelRef: any, videoRef: any, canvasRef: any,
playingRef: any, setText: any, dispatch: any, cornersRef: any, gameRef: any) => {
  let centers: number[][] | null = null;
  let boundary: number[][];
  let state: number[][];
  let board: Chess;
  let movesPairs: MovesPair[];
  let keypoints: number[][];
  let possibleMoves: Set<string>;
  let possiblePieces: number[][];
  let requestId: number;
  let greedyMoveToTime: { [move: string] : number};

  const loop = async () => {
    if (playingRef.current === false || invalidVideo(videoRef)) {
      centers = null
    } else {
      if (centers === null) {
        keypoints = getKeypoints(cornersRef, canvasRef);
        const invTransform = getInvTransform(keypoints);
        centers = transformCenters(invTransform);
        boundary = transformBoundary(invTransform);
        state = zeros(64, 12);
        board = new Chess();
        possibleMoves = new Set<string>;
        board.loadPgn(makePgn(gameRef.current));
        movesPairs = getMovesPairs(board);
        possiblePieces = getPossiblePieces(movesPairs);
        greedyMoveToTime = {};
      }
      const startTime: number = performance.now();
      const startTensors: number = tf.memory().numTensors;

      const {boxes, scores} = await detect(modelRef, videoRef, keypoints);
      const squares: number[] = getSquares(boxes, centers, boundary);
      
      const update: number[][] = getUpdate(scores, squares, possiblePieces);
      state = updateState(state, update);
      const {bestScore1, bestScore2, bestJointScore, bestMove, bestMoves} = processState(state, movesPairs, possibleMoves);

      const endTime: number = performance.now();
      const fps: string = (1000 / (endTime - startTime)).toFixed(1);
      
      let hasMove: boolean = false;
      if (bestMoves !== null) {
        const move: string = bestMoves.sans[0];
        hasMove = (bestScore2 > 0) && (bestJointScore > 0) && (possibleMoves.has(move));
        if (hasMove) {
          board.move(move);
          movesPairs = getMovesPairs(board);
          possiblePieces = getPossiblePieces(movesPairs);
          possibleMoves.clear();
          greedyMoveToTime = {};
          console.info(bestJointScore, bestMoves);
        }
      }

      let hasGreedyMove: boolean = false;
      if (bestMove !== null) {
        const greedyMove: string = bestMove.sans[0];
        if (!(greedyMove in greedyMoveToTime)) { 
          greedyMoveToTime[greedyMove] = endTime;
        }
        const deltaTime = endTime - greedyMoveToTime[greedyMove]
        const oneSecondElapsed = deltaTime > 1000;
        hasGreedyMove = (bestScore1 > 0) && (!(hasMove)) && oneSecondElapsed;
        if (hasGreedyMove) {
          board.move(greedyMove);
        }
      }
      
      if (hasMove || hasGreedyMove) {
        const splitPgn = board.pgn().split("\n\n");
        const moves = splitPgn[splitPgn.length - 1];
        dispatch(gameSetMoves(moves));
        dispatch(gameSetFen(board.fen()));
      }
      
      // FPS + last 2 moves
      const text: string[] = [`FPS: ${fps}`];
      const history: string[] = board.history();
      let moveText: string = "";
      if (history.length == 0) {
        moveText = "";
      } else if (history.length == 1) {
        moveText = `1. ${history[history.length - 1]}`
      } else {
        const firstMove: string = history[history.length - 2];
        const secondMove: string = history[history.length - 1];
        const nHalfMoves: number = Math.floor(history.length / 2);
        if (history.length % 2 == 0) {
          moveText = `${nHalfMoves}.${firstMove} ${secondMove}`
        } else {
          moveText = `${nHalfMoves}...${firstMove} ${nHalfMoves + 1}.${secondMove}`
        }
      }
      text.push(moveText);
      setText(text);
      
      renderBoxes(canvasRef.current, boxes, scores, centers, boundary, squares);
      
      tf.dispose([boxes, scores]);
      
      if (hasGreedyMove) {
        board.undo();
      }

      const endTensors: number = tf.memory().numTensors;
      if (startTensors < endTensors) {
        console.error(`Memory Leak! (${endTensors} > ${startTensors})`)
      }
    }
    requestId = requestAnimationFrame(loop);
  }
  requestId = requestAnimationFrame(loop);

  return () => {
    tf.disposeVariables();
    if (requestId) {
      window.cancelAnimationFrame(requestId);
    }
  };
};
