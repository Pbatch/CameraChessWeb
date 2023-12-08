import { renderBoxes } from "./render/renderBox.jsx";
import { getMoveData } from "./moves.jsx";
import { getCentersAndBoundary } from "./warp.jsx";
import * as tf from "@tensorflow/tfjs";
import { Chess } from 'chess.js';
import { pgnSet } from '../slices/pgnSlice.jsx';
import { getBoxesAndScores, getInput, getXY } from "./detect.jsx";

const zeros = (rows, columns) => {
  return Array.from(Array(rows), _ => Array(columns).fill(0));
}

const calculateScore = (state, move, from_thr=0.6, to_thr=0.6) => {
  let score = 0;
  move.from.forEach(square => {
    score += 1 - Math.max(...state[square]) - from_thr;
  })

  for (let i = 0; i < move.to.length; i++) {
    score += state[move.to[i]][move.targets[i]] - to_thr;
  }

  return score
}

const processState = (state, moveData, possibleMoves) => {
  let bestScore1 = Number.NEGATIVE_INFINITY;
  let bestScore2 = Number.NEGATIVE_INFINITY;
  let bestJointScore = Number.NEGATIVE_INFINITY;
  let bestMove;
  let bestMoves;
  let seen = new Set();

  moveData.forEach(d => {
    if (!(d.move1.san in seen)) {
      seen.add(d.move1.san);
      const score = calculateScore(state, d.move1);
      if (score > 0) {
        possibleMoves.add(d.move1.san);
      }
      if (score > bestScore1) {
        bestMove = d.move1;
        bestScore1 = score;
      }
    }

    if ((d.move2 === undefined) | !(possibleMoves.has(d.move1.san))) {
      return;
    }
    
    const score2 = calculateScore(state, d.move2);
    if (score2 < 0) {
      return;
    } else if (score2 > bestScore2) {
      bestScore2 = score2;
    }

    const jointScore = calculateScore(state, d.moves);
    if (jointScore > bestJointScore) {
      bestJointScore = jointScore;
      bestMoves = d.moves;
    }
  })

  return [bestScore1, bestScore2, bestJointScore, bestMove, bestMoves];
}

const getSquares = (boxes, centers, boundary) => {
  const squares = tf.tidy(() => {
    const l = boxes.slice([0, 0], [-1, 1]);
    const r = boxes.slice([0, 2], [-1, 1]);
    const b = boxes.slice([0, 3], [-1, 1]);
    const cx = l.add(r).div(2);
    const cy = b.sub(r.sub(l).div(3));
    let boxCenters = tf.concat([cx, cy], 1);
    const dist = tf.sum(tf.square(tf.sub(boxCenters.expandDims(1), tf.tensor2d(centers).expandDims(0))), 2);
    let squares = tf.argMin(dist, 1)
    
    squares = squares.arraySync();
    boxCenters = boxCenters.arraySync();
    for (let i = 0; i < squares.length; i++) {
      for (let j = 0; j < 4; j++) {
        const jplus = (j + 1) % 4;
        const a = boundary[j][0] - boundary[jplus][0];
        const b = boundary[j][1] - boundary[jplus][1];
        const c = boxCenters[i][0] - boundary[jplus][0];
        const d = boxCenters[i][1] - boundary[jplus][1];
        const det = (a * d) - (b * c);
        if (det < 0) {
          squares[i] = -1;
        }
      }
    }
    return squares;
  });

  return squares;
}

const updateState = (scores, squares, state, decay=0.5) => {
  const update = zeros(64, 12);
  scores = scores.arraySync();
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

const detect = async (modelRef, webcamRef, keypoints) => {
  const [input, width, height, roi, originalWidth, originalHeight] = getInput(webcamRef, keypoints);
  const preds = modelRef.current.predict(input);
  const [boxes, scores] = getBoxesAndScores(width, height, preds);

  tf.dispose([input, preds]);

  return [boxes, scores, roi, originalWidth, originalHeight]
}

export const findPieces = (modelRef, webcamRef, canvasRef,
recordingRef, setText, dispatch, cornersRef) => {
  let centers = [];
  let boundary;
  let state;
  let board;
  let moveData;
  let keypoints;
  let possibleMoves;
  let requestId = undefined;

  const loop = async () => {
    if (recordingRef.current === false || (webcamRef.current?.srcObject === null && webcamRef.current?.src === null)) {
      centers = [];
    } else {
      if (centers.length == 0) {
        keypoints = ['h1', 'a1', 'a8', 'h8'].map(x => getXY(cornersRef.current[x], canvasRef.current.height,
          canvasRef.current.width));
        [centers, boundary] = getCentersAndBoundary(keypoints);
        state = zeros(64, 12);
        board = new Chess();
        possibleMoves = new Set();
        moveData = getMoveData(board);
      }
      const startTime = performance.now();
      const startTensors = tf.memory().numTensors;

      const [boxes, scores, roi, originalHeight, originalWidth] = await detect(modelRef, webcamRef, keypoints);
      const squares = getSquares(boxes, centers, boundary);
      state = updateState(scores, squares, state);
      const [bestScore1, bestScore2, bestJointScore, bestMove, bestMoves] = processState(state, moveData, possibleMoves);

      const bestMoveSan = bestMoves === undefined ? "" : bestMoves.sans[0];
      const pushMove = (bestScore2 > 0) & (bestJointScore > 0) & (possibleMoves.has(bestMoveSan));
      if (pushMove) {
        board.move(bestMoves.sans[0]);
        moveData = getMoveData(board);
        possibleMoves.clear();
        console.info(bestJointScore, bestMoves);
      }
      
      const greedyMove = (bestScore1 > 0) & (!(pushMove));
      if (greedyMove) {
        board.move(bestMove.san);
      }
      dispatch(pgnSet(board.pgn()));

      const endTime = performance.now();
      const fps = (1000 / (endTime - startTime)).toFixed(1);
      
      // FPS + last 2 moves
      let text = [`FPS: ${fps}`];
      const history = board.history();
      let moveText = "";
      if (history.length == 0) {
        moveText = "";
      } else if (history.length == 1) {
        moveText = `1. ${history[history.length - 1]}`
      } else {
        const firstMove = history[history.length - 2];
        const secondMove = history[history.length - 1];
        const nHalfMoves = Math.floor(history.length / 2);
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

      const endTensors = tf.memory().numTensors;
      if (startTensors !== endTensors) {
        throw new Error(`Memory Leak! (${endTensors} > ${startTensors})`)
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
