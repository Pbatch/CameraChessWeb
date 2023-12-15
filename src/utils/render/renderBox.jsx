import * as Constants from "../constants.jsx";
import * as tf from "@tensorflow/tfjs-core";
import { setupCtx, drawBox, drawPoints, drawPolygon } from "./common.jsx";

export const renderBoxes = (canvasRef, boxes, scores, centers, boundary, squares) => {
  const [ctx, fontHeight, lineWidth, sx, sy] = setupCtx(canvasRef);

  let bboxConfClsSquare = tf.tidy(() => {
    let maxConf = Array(64).fill(0.5);
    let idx = Array(64).fill(-1);

    const confArray = tf.max(scores, 1).arraySync();
    for (let i = 0; i < squares.length; i++) {
      const conf = confArray[i];
      const square = squares[i];

      if (square === -1) {
        continue;
      }

      if (conf > maxConf[square]) {
        idx[square] = i;
        maxConf[square] = conf;
      }
    };

    idx = idx.filter(i => i != -1);
    const squaresTensor = tf.tensor1d(squares);
    const bboxConfClsSquare = tf.concat([tf.gather(boxes, idx),
    tf.expandDims(tf.gather(tf.max(scores, 1), idx), 1),
    tf.expandDims(tf.gather(tf.argMax(scores, 1), idx), 1),
    tf.expandDims(tf.gather(squaresTensor, idx), 1)],
    1);
    return bboxConfClsSquare.arraySync();
  });

  drawPoints(ctx, centers, "blue", sx, sy);
  drawPolygon(ctx, boundary, "blue", sx, sy);

  const colors = new Colors();
  bboxConfClsSquare.forEach(x => {
    let [x1, y1, x2, y2, conf, clsIdx, square] = x;
    const color = colors.get(clsIdx);

    drawPolygon(ctx, 
      [[x1, y1], [x2, y1], [x2, y2], [x1, y2]], 
      color, sx, sy)

    drawPoints(ctx, [[sx * (x1 + x2) / 2, sy * (y2 - (sx * (x2 - x1) / 3))]], color, 1, 1)

    // Draw the label background.
    const text = `${Constants.LABELS[clsIdx]}${Constants.SQUARE_NAMES[square]}`;
    drawBox(ctx, color, x1, y1, text, fontHeight, lineWidth, sx, sy);
  });
};

class Colors {
  constructor() {
    this.palette = [
      "#FF3838",
      "#FF9D97",
      "#FF701F",
      "#FFB21D",
      "#CFD231",
      "#48F90A",
      "#92CC17",
      "#3DDB86",
      "#1A9334",
      "#00D4BB",
      "#2C99A8",
      "#00C2FF",
    ];
    this.n = this.palette.length;
  }

  get = (i) => this.palette[Math.floor(i) % this.n];
}
