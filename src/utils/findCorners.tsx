import * as tf from "@tensorflow/tfjs-core";
import { renderCorners } from "./render/renderCorners";
import Delaunator from 'delaunator';
import { getPerspectiveTransform, perspectiveTransform } from "./warp";
import { getBoxesAndScores, getInput, getCenters, getMarkerXY, invalidVideo } from "./detect";
import { cornersSet } from '../slices/cornersSlice';
import { MODEL_WIDTH, MODEL_HEIGHT, CORNER_KEYS } from "./constants";
import { clamp } from "./math";
import { CornersDict, CornersPayload } from "../types";
import { array, NDArray } from "vectorious";

const x: number[] = Array.from({ length: 7 }, (_, i) => i);
const y: number[] = Array.from({ length: 7 }, (_, i) => i);
const GRID: number[][] = y.map(yy => x.map(xx => [xx, yy])).flat();
const IDEAL_QUAD: number[][] = [[0, 1], [1, 1], [1, 0], [0, 0]];

const processBoxesAndScores = async (boxes: tf.Tensor2D, scores: tf.Tensor2D) => {
  const maxScores: tf.Tensor1D = tf.max(scores, 1);
  const argmaxScores: tf.Tensor1D = tf.argMax(scores, 1);
  const nms: tf.Tensor1D = await tf.image.nonMaxSuppressionAsync(boxes, maxScores, 100, 0.3, 0.1);
  const resTensor: tf.Tensor2D = tf.tidy(() => {
    const centers: tf.Tensor2D = getCenters(tf.gather(boxes, nms, 0));
    const cls: tf.Tensor2D = tf.expandDims(tf.gather(argmaxScores, nms, 0), 1);
    const res: tf.Tensor2D = tf.concat([centers, cls], 1);
    return res;
  });
  const res: number[][] = resTensor.arraySync();

  tf.dispose([nms, resTensor, boxes, scores, argmaxScores, maxScores]);
  return res;
}

const runPiecesModel = async (videoRef: any, piecesModelRef: any): Promise<number[][]> => {
  const videoWidth: number = videoRef.current.videoWidth;
  const videoHeight: number = videoRef.current.videoHeight;

  const { image4D, width, height, padding, roi } = getInput(videoRef);
  const piecesPreds: tf.Tensor3D = piecesModelRef.current.predict(image4D);
  const boxesAndScores = getBoxesAndScores(piecesPreds, width, height, videoWidth, videoHeight, padding, roi);
  const pieces: number[][] = await processBoxesAndScores(boxesAndScores.boxes, boxesAndScores.scores);

  tf.dispose([piecesPreds, image4D, boxesAndScores]);
  return pieces;
}

const runXcornersModel = async (videoRef: any, xcornersModelRef: any, pieces: number[][]):
  Promise<number[][]> => {
  const keypoints: number[][] = pieces.map(x => [x[0], x[1]]);
  const videoWidth: number = videoRef.current.videoWidth;
  const videoHeight: number = videoRef.current.videoHeight;

  const { image4D, width, height, padding, roi } = getInput(videoRef, keypoints);
  const xcornersPreds: tf.Tensor3D = xcornersModelRef.current.predict(image4D);
  const boxesAndScores = getBoxesAndScores(xcornersPreds, width, height, videoWidth, videoHeight, padding, roi);
  tf.dispose([xcornersPreds, image4D]);

  let xCorners: number[][] = await processBoxesAndScores(boxesAndScores.boxes, boxesAndScores.scores);
  xCorners = xCorners.map(x => [x[0], x[1]]);
  return xCorners;
}

const getQuads = (xCorners: number[][]) => {
  const intXcorners = xCorners.flat().map(x => Math.round(x));
  const delaunay = new Delaunator(intXcorners);
  const triangles = delaunay.triangles;
  const quads: number[][][] = [];
  const seen = new Set<string>();
  for (let i = 0; i < triangles.length; i += 3) {
    const first = [triangles[i], triangles[i + 1], triangles[i + 2]];

    for (let j = i + 3; j < triangles.length; j += 3) {
      if (i === j) {
        continue;
      }
      const second = [triangles[j], triangles[j + 1], triangles[j + 2]];
      if (first.filter(index => second.includes(index)).length !== 2) continue;

      const indices = Array.from(new Set([...first, ...second]));
      if (indices.length !== 4) continue;
      const key = [...indices].sort((a, b) => a - b).join(',');
      if (seen.has(key)) continue;
      seen.add(key);

      const points = indices.map(index => xCorners[index]);
      const center = getCenter(points);
      points.sort((a, b) => Math.atan2(a[1] - center[1], a[0] - center[0])
        - Math.atan2(b[1] - center[1], b[0] - center[0]));
      const signedArea = points.reduce((area, point, index) => {
        const next = points[(index + 1) % points.length];
        return area + point[0] * next[1] - next[0] * point[1];
      }, 0);
      if (signedArea > 0) points.reverse();
      quads.push(points);
    }
  }
  return quads;
}

const cdist = (a: number[][], b: number[][]) => {
  const dist = Array.from({ length: a.length }, () => Array(b.length).fill(0));
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      const dx = a[i][0] - b[j][0];
      const dy = a[i][1] - b[j][1];
      dist[i][j] = Math.sqrt(dx * dx + dy * dy);
    }
  }
  return dist;
}

type GridMatch = { grid: number[]; image: number[]; error: number };

const getGridMatches = (warpedXcorners: number[][], xCorners: number[][], shift: number[], threshold = 0.34) => {
  const matches = new Map<string, GridMatch>();
  for (let index = 0; index < warpedXcorners.length; index++) {
    const warped = warpedXcorners[index];
    const gx = Math.round(warped[0]);
    const gy = Math.round(warped[1]);
    if (gx < shift[0] || gx > shift[0] + 6 || gy < shift[1] || gy > shift[1] + 6) continue;

    const error = Math.hypot(warped[0] - gx, warped[1] - gy);
    if (error > threshold) continue;
    const key = `${gx},${gy}`;
    const current = matches.get(key);
    if (!current || error < current.error) {
      matches.set(key, { grid: [gx, gy], image: xCorners[index], error });
    }
  }
  return Array.from(matches.values());
};

// Robust projective fit using every visible intersection of the 7 x 7 inner lattice.
const fitGridHomography = (matches: GridMatch[]): NDArray => {
  const normal = Array.from({ length: 8 }, () => Array(8).fill(0));
  const rhs = Array(8).fill(0);

  const accumulate = (row: number[], value: number) => {
    for (let i = 0; i < 8; i++) {
      rhs[i] += row[i] * value;
      for (let j = 0; j < 8; j++) normal[i][j] += row[i] * row[j];
    }
  };

  matches.forEach(({ grid: [u, v], image: [x, y] }) => {
    accumulate([u, v, 1, 0, 0, 0, -x * u, -x * v], x);
    accumulate([0, 0, 0, u, v, 1, -y * u, -y * v], y);
  });

  const solution = array(normal).solve(array(rhs, { shape: [8, 1] })).toArray();
  return array([...solution, 1], { shape: [3, 3] });
};

const refineGridHomography = (matches: GridMatch[]) => {
  let transform = fitGridHomography(matches);
  const projected = perspectiveTransform(matches.map(match => match.grid), transform);
  const errors = matches.map((match, index) => euclidean(projected[index], match.image));
  const sortedErrors = [...errors].sort((a, b) => a - b);
  const medianError = sortedErrors[Math.floor(sortedErrors.length / 2)];
  const robustLimit = Math.max(2, medianError * 2.5);
  const inliers = matches.filter((_, index) => errors[index] <= robustLimit);
  if (inliers.length >= 8) transform = fitGridHomography(inliers);
  return { transform, inlierCount: inliers.length, medianError };
};

const calculateOffsetScore = (warpedXcorners: number[][], shift: number[]) => {
  const grid = GRID.map(x => [x[0] + shift[0], x[1] + shift[1]]);
  const dist = cdist(grid, warpedXcorners);

  const gridCost = dist.reduce((sum, row) => sum + Math.min(1.5, Math.min(...row)), 0) / grid.length;
  const detectionCost = warpedXcorners.reduce((sum, _, detectionIndex) => {
    const nearest = Math.min(...dist.map(row => row[detectionIndex]));
    return sum + Math.min(1.5, nearest);
  }, 0) / warpedXcorners.length;
  const score = 1 / (1 + gridCost + detectionCost);

  return score;
}

const calculateLatticeScore = (warpedXcorners: number[][], xCorners: number[][], shift: number[]) => {
  const matches = getGridMatches(warpedXcorners, xCorners, shift);
  if (matches.length < 4) return Number.NEGATIVE_INFINITY;
  const xs = matches.map(match => match.grid[0]);
  const ys = matches.map(match => match.grid[1]);
  const span = (Math.max(...xs) - Math.min(...xs)) + (Math.max(...ys) - Math.min(...ys));
  const meanError = matches.reduce((sum, match) => sum + match.error, 0) / matches.length;
  return matches.length * 10 + span - meanError * 5 + calculateOffsetScore(warpedXcorners, shift);
};

const findOffset = (warpedXcorners: number[][], xCorners: number[][]) => {
  let bestOffset = [0, 0];
  let bestScore = Number.NEGATIVE_INFINITY;
  for (let dx = -7; dx <= 1; dx++) {
    for (let dy = -7; dy <= 1; dy++) {
      const score = calculateLatticeScore(warpedXcorners, xCorners, [dx, dy]);
      if (score > bestScore) {
        bestScore = score;
        bestOffset = [dx, dy];
      }
    }
  }

  return bestOffset;
}

const scoreQuad = (quad: number[][], xCorners: number[][]): [number, NDArray, number[]] => {
  const M: NDArray = getPerspectiveTransform(IDEAL_QUAD, quad);
  const warpedXcorners: number[][] = perspectiveTransform(xCorners, M);
  const offset: number[] = findOffset(warpedXcorners, xCorners);

  const score: number = calculateLatticeScore(warpedXcorners, xCorners, offset);
  return [score, M, offset]
}

const findCornersFromXcorners = (xCorners: number[][]) => {
  const quads: number[][][] = getQuads(xCorners);
  if (quads.length == 0) {
    return;
  }

  let bestScore = Number.NEGATIVE_INFINITY;
  let bestM: NDArray | undefined;
  let bestOffset: number[] | undefined;
  for (const quad of quads) {
    try {
      const [score, M, offset] = scoreQuad(quad, xCorners);
      if (score > bestScore) {
        bestScore = score;
        bestM = M;
        bestOffset = offset;
      }
    } catch (_) {
      // Degenerate Delaunay quads can produce a singular homography.
    }
  }

  if (!bestM || !bestOffset) return;

  const warpedXcorners = perspectiveTransform(xCorners, bestM);
  const matches = getGridMatches(warpedXcorners, xCorners, bestOffset);
  let gridToImage = bestM.inv();
  if (matches.length >= 8) {
    try {
      const refined = refineGridHomography(matches);
      if (refined.inlierCount >= 8 && refined.medianError < 8) {
        gridToImage = refined.transform;
      }
    } catch (_) {
      // Keep the four-point hypothesis when the all-grid fit is ill-conditioned.
    }
  }
  const warpedCorners = [[bestOffset[0] - 1, bestOffset[1] - 1],
  [bestOffset[0] - 1, bestOffset[1] + 7],
  [bestOffset[0] + 7, bestOffset[1] + 7],
  [bestOffset[0] + 7, bestOffset[1] - 1]]
  const corners = perspectiveTransform(warpedCorners, gridToImage);

  const area = Math.abs(corners.reduce((sum, point, index) => {
    const next = corners[(index + 1) % corners.length];
    return sum + point[0] * next[1] - next[0] * point[1];
  }, 0)) / 2;
  const shortestEdge = Math.min(...corners.map((point, index) => euclidean(point, corners[(index + 1) % 4])));
  if (!Number.isFinite(bestScore) || area < MODEL_WIDTH * MODEL_HEIGHT * 0.04 || shortestEdge < 20
    || corners.flat().some(value => !Number.isFinite(value))) {
    return;
  }

  // Clip bad corners
  for (let i = 0; i < 4; i++) {
    corners[i][0] = clamp(corners[i][0], 0, MODEL_WIDTH);
    corners[i][1] = clamp(corners[i][1], 0, MODEL_HEIGHT);
  }

  return corners;
}

const getCenter = (points: number[][]) => {
  let center = points.reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
  center = center.map(x => x / points.length);
  return center
}

const euclidean = (a: number[], b: number[]) => {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dist = Math.sqrt((dx * dx) + (dy * dy))
  return dist;
}

const calculateKeypoints = (blackPieces: number[][], whitePieces: number[][], corners: number[][]) => {
  const blackCenter = getCenter(blackPieces);
  const whiteCenter = getCenter(whitePieces);

  let bestShift = 0;
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

  const keypoints: CornersDict = {
    "a1": corners[bestShift % 4],
    "h1": corners[(bestShift + 1) % 4],
    "h8": corners[(bestShift + 2) % 4],
    "a8": corners[(bestShift + 3) % 4]
  }
  return keypoints
}

const waitForVideoFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

const consensusKeypoints = (samples: CornersDict[]): CornersDict => {
  const result = {} as CornersDict;
  CORNER_KEYS.forEach((key) => {
    result[key] = [
      median(samples.map(sample => sample[key][0])),
      median(samples.map(sample => sample[key][1]))
    ];
  });
  return result;
};

const detectCornersSample = async (piecesModelRef: any, xcornersModelRef: any, videoRef: any) => {
  const pieces = await runPiecesModel(videoRef, piecesModelRef);
  const blackPieces = pieces.filter(x => (x[2] <= 5));
  const whitePieces = pieces.filter(x => (x[2] > 5));
  if (blackPieces.length === 0 || whitePieces.length === 0) return null;

  const xCorners = await runXcornersModel(videoRef, xcornersModelRef, pieces);
  if (xCorners.length < 5) return null;
  const corners = findCornersFromXcorners(xCorners);
  if (!corners) return null;
  return { keypoints: calculateKeypoints(blackPieces, whitePieces, corners), xCorners };
};

export const findCornersSingleFrame = async (piecesModelRef: any, xcornersModelRef: any, videoRef: any,
  canvasRef: any, dispatch: any, setText: any) => {
  if (invalidVideo(videoRef)) {
    return;
  }

  const pieces = await runPiecesModel(videoRef, piecesModelRef);
  const blackPieces = pieces.filter(x => (x[2] <= 5));
  const whitePieces = pieces.filter(x => (x[2] > 5));
  if ((blackPieces.length == 0) || (whitePieces.length == 0)) {
    setText(["No pieces to label corners"]);
    return;
  }

  const xCorners = await runXcornersModel(videoRef, xcornersModelRef, pieces);
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

  const keypoints: CornersDict = calculateKeypoints(blackPieces, whitePieces, corners);

  CORNER_KEYS.forEach((key) => {
    const xy: number[] = keypoints[key];
    const payload: CornersPayload = {
      "xy": getMarkerXY(xy, canvasRef.current.height, canvasRef.current.width),
      "key": key
    }
    dispatch(cornersSet(payload))
  })
  renderCorners(canvasRef.current, xCorners);
  setText(["Found corners", "Ready to record"])
}

export const _findCorners = async (piecesModelRef: any, xcornersModelRef: any, videoRef: any,
  canvasRef: any, dispatch: any, setText: any) => {
  if (invalidVideo(videoRef)) return;

  const samples: { keypoints: CornersDict, xCorners: number[][] }[] = [];
  const sampleCount = 5;
  setText(["Finding corners", "Hold the camera still..."]);
  for (let index = 0; index < sampleCount; index++) {
    try {
      const sample = await detectCornersSample(piecesModelRef, xcornersModelRef, videoRef);
      if (sample) samples.push(sample);
    } catch (error) {
      console.warn(`Corner sample ${index + 1} failed`, error);
    }
    await waitForVideoFrame();
  }

  if (samples.length < 3) {
    setText(["Could not find stable corners", `Valid frames: ${samples.length}/${sampleCount}`]);
    return;
  }

  const roughConsensus = consensusKeypoints(samples.map(sample => sample.keypoints));
  const deviations = samples.map(sample => CORNER_KEYS.reduce((sum, key) =>
    sum + euclidean(sample.keypoints[key], roughConsensus[key]), 0) / CORNER_KEYS.length);
  const deviationLimit = Math.max(10, median(deviations) * 2.5);
  const stableSamples = samples.filter((_, index) => deviations[index] <= deviationLimit);
  const keypoints = consensusKeypoints(stableSamples.map(sample => sample.keypoints));
  const bestSampleIndex = deviations.indexOf(Math.min(...deviations));

  CORNER_KEYS.forEach((key) => {
    const payload: CornersPayload = {
      xy: getMarkerXY(keypoints[key], canvasRef.current.height, canvasRef.current.width),
      key
    };
    dispatch(cornersSet(payload));
  });
  renderCorners(canvasRef.current, samples[bestSampleIndex].xCorners);
  setText(["Found stable corners", `${stableSamples.length}/${sampleCount} frames agreed`]);
};

export const findCorners = async (piecesModelRef: any, xcornersModelRef: any, videoRef: any, canvasRef: any,
  dispatch: any, setText: any) => {
  const startTensors = tf.memory().numTensors;

  await _findCorners(piecesModelRef, xcornersModelRef, videoRef, canvasRef, dispatch, setText);

  const endTensors = tf.memory().numTensors;
  if (startTensors < endTensors) {
    console.error(`Memory Leak! (${endTensors} > ${startTensors})`)
  }

  return () => {
    tf.disposeVariables();
  };
}
