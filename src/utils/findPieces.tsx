import { renderBoxes } from "./render/renderBox";
import * as tf from "@tensorflow/tfjs-core";
import { getMovesPairs } from "./moves";
import { getInvTransform, transformBoundary, transformCenters } from "./warp";
import { Chess } from 'chess.js';
import { pgnSet } from '../slices/pgnSlice';
import { fenSet } from '../slices/fenSlice';
import { getBoxesAndScores, getInput, getXY, invalidWebcam } from "./detect";
import { MovesData, MovesPair } from "../types";

const zeros = (rows: number, columns: number) => {
  return Array.from(Array(rows), _ => Array(columns).fill(0));
}

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

const getSquares = (boxes: tf.Tensor2D, centers: number[][], boundary: number[][]): number[] => {
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

const updateState = (scoresTensor: tf.Tensor2D, squares: number[], state: any, decay: number=0.5) => {
  const update: number[][] = zeros(64, 12);
  const scores: number[][] = scoresTensor.arraySync();
  squares.forEach((square, i) => {
    if (square == -1) {
      return;
    }
    for (let j = 0; j < 12; j++) {
      update[square][j] = Math.max(update[square][j], scores[i][j]);
    }
  })

  for (let i = 0; i < 64; i++) {
    for (let j = 0; j < 12; j++) {
      state[i][j] = decay * state[i][j] + (1 - decay) * update[i][j]
    }
  }

  return state
}

const detect = async (modelRef: any, webcamRef: any, keypoints: number[][]):
  Promise<{boxes: tf.Tensor2D, scores: tf.Tensor2D}> => {
  const {image4D, width, height, padding, roi} = getInput(webcamRef, keypoints);
  const videoWidth: number = webcamRef.current.videoWidth;
  const videoHeight: number = webcamRef.current.videoHeight;
  const preds: tf.Tensor3D = modelRef.current.predict(image4D);
  const {boxes, scores} = getBoxesAndScores(preds, width, height, videoWidth, videoHeight, padding, roi);

  tf.dispose([image4D, preds]);

  return {boxes, scores}
}

export const findPieces = (modelRef: any, webcamRef: any, canvasRef: any,
recordingRef: any, setText: any, dispatch: any, cornersRef: any) => {
  let centers: number[][] | null = null;
  let boundary: number[][];
  let state: number[][];
  let board: Chess;
  let movesPairs: MovesPair[];
  let keypoints: number[][];
  let possibleMoves: Set<string>;
  let requestId: number;

  const loop = async () => {
    if (recordingRef.current === false || invalidWebcam(webcamRef)) {
      centers = null
    } else {
      if (centers === null) {
        keypoints = ['h1', 'a1', 'a8', 'h8'].map(x => getXY(cornersRef.current[x], canvasRef.current.height,
          canvasRef.current.width));
        const invTransform = getInvTransform(keypoints);
        centers = transformCenters(invTransform);
        boundary = transformBoundary(invTransform);
        state = zeros(64, 12);
        board = new Chess();
        possibleMoves = new Set();
        movesPairs = getMovesPairs(board);
      }
      const startTime: number = performance.now();
      const startTensors: number = tf.memory().numTensors;

      const {boxes, scores} = await detect(modelRef, webcamRef, keypoints);
      const squares: number[] = getSquares(boxes, centers, boundary);
      state = updateState(scores, squares, state);
      const {bestScore1, bestScore2, bestJointScore, bestMove, bestMoves} = processState(state, movesPairs, possibleMoves);
      
      let pushMove: boolean = false;
      if (bestMoves !== null) {
        pushMove = (bestScore2 > 0) && (bestJointScore > 0) && (possibleMoves.has(bestMoves.sans[0]));
        if (pushMove) {
          board.move(bestMoves.sans[0]);
          movesPairs = getMovesPairs(board);
          possibleMoves.clear();
          console.info(bestJointScore, bestMoves);
        }
      }
      
      let greedyMove: boolean = true;
      if (bestMove !== null) {
        greedyMove = (bestScore1 > 0) && (!(pushMove));
        if (greedyMove) {
          board.move(bestMove.sans[0]);
        }
      }

      dispatch(pgnSet(board.pgn()));
      dispatch(fenSet(board.fen()));

      const endTime: number = performance.now();
      const fps: string = (1000 / (endTime - startTime)).toFixed(1);
      
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
      
      if (greedyMove) {
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
