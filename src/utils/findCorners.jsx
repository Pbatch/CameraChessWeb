import * as tf from "@tensorflow/tfjs";
import { renderCorners } from "./render/renderCorners.jsx";
import Delaunator from 'delaunator';
import { getPerspectiveTransform, perspectiveTransform } from "./warp.jsx";
import { getBoxesAndScores, getInput, getCenters, getMarkerXY } from "./detect.jsx";
import { cornersSet } from '../slices/cornersSlice.jsx';

const x = Array.from({ length: 7 }, (_, i) => i);
const y = Array.from({ length: 7 }, (_, i) => i);
const GRID = y.map(yy => x.map(xx => [xx, yy])).flat();

const IDEAL_QUAD = [[0, 1], [1, 1], [1, 0], [0, 0]];

const runModels = async (webcamRef, xcornersModelRef, piecesModelRef) => {
  const [input, width, height] = getInput(webcamRef);

  const xcornersPreds = xcornersModelRef.current.predict(input); 
  const piecesPreds = piecesModelRef.current.predict(input);
  tf.dispose([input])

  let [xcornersBoxes, xcornersScores] = getBoxesAndScores(width, height, xcornersPreds);
  const xcornersNms = await tf.image.nonMaxSuppressionAsync(xcornersBoxes, xcornersScores, 100, 0.3, 0.1);
  const keptXcornersBoxes = xcornersBoxes.gather(xcornersNms, 0);
  const xcornersTensor = getCenters(keptXcornersBoxes);
  const xCorners = xcornersTensor.arraySync();

  tf.dispose([xcornersPreds, xcornersBoxes, xcornersScores, xcornersNms, xcornersTensor, keptXcornersBoxes])

  let [piecesBoxes, piecesScores] = getBoxesAndScores(width, height, piecesPreds);
  const maxPiecesScores = tf.max(piecesScores, 1);
  const piecesNms = await tf.image.nonMaxSuppressionAsync(piecesBoxes, maxPiecesScores, 100, 0.3, 0.1);
  
  const piecesTensor = tf.tidy(() => {
    const keptPiecesBoxes = piecesBoxes.gather(piecesNms, 0);
    const piecesCenters = getCenters(keptPiecesBoxes);
    const argmaxPiecesScores = tf.expandDims(tf.argMax(piecesScores.gather(piecesNms, 0), 1), 1);
    const piecesTensor = tf.concat([piecesCenters, argmaxPiecesScores], 1)
    return piecesTensor;
  });
  const pieces = piecesTensor.arraySync();

  tf.dispose([piecesPreds, piecesBoxes, piecesScores, piecesNms, piecesTensor, maxPiecesScores]);

  return [xCorners, pieces];
}

const getQuads = (xCorners) => {
  const intXcorners = xCorners.flat().map(x => Math.round(x));
  const delaunay = new Delaunator(intXcorners);
  const triangles = delaunay.triangles;
  const quads = [];
  for (let i = 0; i < triangles.length; i += 3) {
    const t1 = triangles[i];
    const t2 = triangles[i + 1];
    const t3 = triangles[i + 2];
    const quad = [t1, t2, t3, -1];

    for (let j = 0; j < triangles.length; j += 3) {
      if (i === j) {
        continue;
      }
      const cond1 = (t1 === triangles[j] && t2 === triangles[j + 1]) || (t1 === triangles[j + 1] && t2 === triangles[j]);
      const cond2 = (t2 === triangles[j] && t3 === triangles[j + 1]) || (t2 === triangles[j + 1] && t3 === triangles[j]);
      const cond3 = (t3 === triangles[j] && t1 === triangles[j + 1]) || (t3 === triangles[j + 1] && t1 === triangles[j]);
      if ((cond1 || cond2 || cond3)) {
        quad[3] = triangles[j + 2];
        break;
      }
    };
    
    if (quad[3] !== -1) {
      quads.push(quad.map(x => xCorners[x]));
    }
  }
  return quads;
}

const cdist = (a, b) => {
  let dist = Array.from({ length: a.length }, () => Array(b.length).fill(0));
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      const dx = a[i][0] - b[j][0];
      const dy = a[i][1] - b[j][1];
      dist[i][j] = Math.sqrt(dx * dx + dy * dy);
    }
  }
  return dist;
}

const calculateOffsetScore = (warpedXcorners, shift) => {
  const grid = GRID.map(x => [x[0] + shift[0], x[1] + shift[1]]);
  const dist = cdist(grid, warpedXcorners);
  
  let assignmentCost = 0;
  for (let i = 0; i < dist.length; i++) {
    assignmentCost += Math.min(...dist[i]);
  }
  const score = 1 / (1 + assignmentCost);

  return score;
}

const findOffset = (warpedXcorners) => {
  let bestOffset = [0, 0];
  for (let i = 0; i < 2; i++) {
    let low = -7;
    let high = 1;
    let scores = {};
    while ((high - low) > 1) {
      const mid = (high + low) >> 1;
      [mid, mid + 1].forEach(x => {
        if (!(x in scores)) {
          let shift = [0, 0];
          shift[i] = x;
          scores[x] = calculateOffsetScore(warpedXcorners, shift);
        }
      });
      if (scores[mid] > scores[mid + 1]) {
        high = mid
      } else {
        low = mid
      }
    }
    bestOffset[i] = low + 1;
  }

  return bestOffset;
}

const scoreQuad = (quad, xCorners) => {
  const M = getPerspectiveTransform(IDEAL_QUAD, quad);
  const warpedXcorners = perspectiveTransform(xCorners, M);
  const offset = findOffset(warpedXcorners);

  const score = calculateOffsetScore(warpedXcorners, offset);
  return [score, M, offset]
}

const findCornersFromXcorners = (xCorners) => {
  const quads = getQuads(xCorners);
  if (quads.length == 0) {
    return;
  }
  let bestScore = 0
  let bestM = null;
  let bestQuad = null;
  let bestOffset = null;
  quads.forEach(quad => {
    const [score, M, offset] = scoreQuad(quad, xCorners);
    if (score > bestScore) {
      bestScore = score;
      bestM = M;
      bestQuad = quad;
      bestOffset = offset;
    }
  });

  const invM = bestM.inv()
  const warpedCorners = [[bestOffset[0] - 1, bestOffset[1] - 1],
                         [bestOffset[0] - 1, bestOffset[1] + 7],
                         [bestOffset[0] + 7, bestOffset[1] + 7],
                         [bestOffset[0] + 7, bestOffset[1] - 1]]
  const corners = perspectiveTransform(warpedCorners, invM);

  return corners;
}

const getCenter = (points) => {
  let center = points.reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
  center = center.map(x => x / points.length);
  return center
}

const euclidean = (a, b) => {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dist = Math.sqrt((dx * dx) + (dy * dy))
  return dist;
}

const calculateKeypoints = (pieces, corners) => {
  const blackPieces = pieces.filter(x => x[2] <= 5).map(x => [x[0], x[1]]);
  const whitePieces = pieces.filter(x => x[2] > 5).map(x => [x[0], x[1]]);
  if ((blackPieces.length == 0) || (whitePieces.length == 0)) {
    return;
  }
  const blackCenter = getCenter(blackPieces);
  const whiteCenter = getCenter(whitePieces);
  
  let bestShift;
  let bestScore = 0;
  for (let shift = 0; shift < 4; shift++) {
    const cw = [(corners[shift % 4][0] + corners[(shift + 1) % 4][0]) / 2,
                (corners[shift % 4][1] + corners[(shift + 1) % 4][1]) / 2];
    const cb = [(corners[(shift + 2) % 4][0] + corners[(shift + 3) % 4][0]) / 2,
                (corners[(shift + 2) % 4][1] + corners[(shift + 3) % 4][1]) / 2];
    const score = 1 / (1 + euclidean(whiteCenter, cw) + euclidean(blackCenter, cb));
    if (score > bestScore) {
      bestScore = score;
      bestShift = shift;
    }
  }
  const keypoints = {"a1": corners[bestShift % 4],
                     "h1": corners[(bestShift + 1) % 4],
                     "h8": corners[(bestShift + 2) % 4],
                     "a8": corners[(bestShift + 3) % 4]}
  return keypoints
}

export const _findCorners = async (piecesModelRef, xcornersModelRef, webcamRef, canvasRef, dispatch, setText) => {
  const [xCorners, pieces] = await runModels(webcamRef, xcornersModelRef, piecesModelRef);
  if (xCorners.length < 5) {
    // With <= 5 xCorners, no quads are found
    setText(["Need ≥5 xCorners", `Detected ${xCorners.length}`]);
    return;
  }

  const corners = findCornersFromXcorners(xCorners);
  if (corners === undefined) {
    setText(["Failed to find corners"]);
    return;
  }

  const keypoints = calculateKeypoints(pieces, corners);
  if (keypoints === undefined) {
    setText(["No pieces to label corners"]);
    return;
  }

  ["h1", "a1", "a8", "h8"].forEach(key => {
    const payload = {"xy": getMarkerXY(keypoints[key], canvasRef.current.height, canvasRef.current.width),
                     "key": key}
    dispatch(cornersSet(payload))
  })
  renderCorners(canvasRef.current, keypoints, xCorners);
  setText(["Found corners", "Ready to record"])
}

export const findCorners = async (piecesModelRef, xcornersModelRef, webcamRef, canvasRef, dispatch, setText) => {
  const startTensors = tf.memory().numTensors;

  await _findCorners(piecesModelRef, xcornersModelRef, webcamRef, canvasRef, dispatch, setText);

  const endTensors = tf.memory().numTensors;
  if (startTensors !== endTensors) {
    throw new Error(`Memory Leak! (${endTensors} > ${startTensors})`)
  }

  return () => {
    tf.disposeVariables();
  };
}