import { LABELS, PALETTE, SQUARE_NAMES } from "../constants";
import * as tf from "@tensorflow/tfjs-core";
import { setupCtx, drawBox, drawPoints, drawPolygon } from "./common";

export const renderBoxes = (canvasRef: any, boxes: tf.Tensor2D, scores: tf.Tensor2D, centers: number[][], boundary: number[][], squares: number[]) => {
  const [ctx, fontHeight, lineWidth, sx, sy] = setupCtx(canvasRef);

  const bboxConfClsSquare: number[][] = tf.tidy(() => {
    const maxConf: number[] = Array(64).fill(0.5);
    let idx: number[] = Array(64).fill(-1);

    const maxScoresTensor: tf.Tensor1D = tf.max(scores, 1);
    const maxScores: number[] = maxScoresTensor.arraySync();
    for (let i: number = 0; i < squares.length; i++) {
      const conf: number = maxScores[i];
      const square: number = squares[i];

      if (square === -1) {
        continue;
      }

      if (conf > maxConf[square]) {
        idx[square] = i;
        maxConf[square] = conf;
      }
    }

    idx = idx.filter((i: number) => i != -1);
    const keptBoxes: tf.Tensor2D = tf.gather(boxes, idx);
    const keptScores: tf.Tensor2D = tf.expandDims(tf.gather(tf.max(scores, 1), idx), 1);
    const keptCls: tf.Tensor2D = tf.expandDims(tf.gather(tf.argMax(scores, 1), idx), 1);
    const keptSquares: tf.Tensor2D = tf.expandDims(tf.gather(tf.tensor1d(squares), idx), 1); 
    const bboxConfClsSquareTensor: tf.Tensor2D = tf.concat([
      keptBoxes,
      keptScores,
      keptCls,
      keptSquares
    ], 1);
    const bboxConfClsSquare: number[][] = bboxConfClsSquareTensor.arraySync();
    return bboxConfClsSquare;
  });

  drawPoints(ctx, centers, "blue", sx, sy);
  drawPolygon(ctx, boundary, "blue", sx, sy);

  bboxConfClsSquare.forEach(x => {
    const [x1, y1, x2, y2, _, clsIdx, square] = x;
    const color = PALETTE[clsIdx % PALETTE.length];

    drawPolygon(ctx, 
      [[x1, y1], [x2, y1], [x2, y2], [x1, y2]], 
      color, sx, sy)

    drawPoints(ctx, [[sx * (x1 + x2) / 2, sy * (y2 - (sx * (x2 - x1) / 3))]], color, 1, 1)

    // Draw the label background.
    const text = `${LABELS[clsIdx]}${SQUARE_NAMES[square]}`;
    drawBox(ctx, color, x1, y1, text, fontHeight, lineWidth, sx, sy);
  });
};
