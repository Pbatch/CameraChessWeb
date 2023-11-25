import * as Constants from "../constants.jsx";
import * as tf from "@tensorflow/tfjs";
import { drawBox, drawPoints, drawPolygon } from "./common.jsx";


export const renderBoxes = (canvasRef, boxes, scores, centers, boundary, squares) => {
  const ctx = canvasRef.getContext("2d");
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const sx = width / Constants.MODEL_SIZE;
  const sy = height / Constants.MODEL_SIZE;

  ctx.clearRect(0, 0, width, height);

  // font configs
  const fontSize = Math.max(Math.round(Math.max(width, height) / 40), 14);
  const font = `${fontSize}px Arial`;
  const fontHeight = parseInt(font, 10);
  const lineWidth = Math.max(Math.min(width, height) / 200, 2.5);
  
  ctx.textBaseline = "top";
  ctx.lineWidth = lineWidth;
  ctx.font = font;

  let bboxConfCls = tf.tidy(() => {
    let maxConf = Array(64).fill(0.5);
    let idx = Array(64).fill(-1);

    const confArray = scores.max(1).arraySync();
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

    idx = idx.filter((i) => i != -1);
    const bboxConfCls = tf.concat([boxes.gather(idx),
    scores.max(1).gather(idx).expandDims(1),
    scores.argMax(1).gather(idx).expandDims(1)],
    1);
    return bboxConfCls.arraySync();
  });

  drawPoints(ctx, centers, "blue", sx, sy);
  drawPolygon(ctx, boundary, "blue", sx, sy);

  const colors = new Colors();
  bboxConfCls.forEach(x => {
    let [x1, y1, x2, y2, conf, clsIdx] = x;
    const color = colors.get(clsIdx);

    drawPolygon(ctx, 
      [[x1, y1], [x2, y1], [x2, y2], [x1, y2]], 
      color, sx, sy)

    drawPoints(ctx, [[sx * (x1 + x2) / 2, sy * (y2 - (sx * (x2 - x1) / 3))]], color, 1, 1)

    // Draw the label background.
    const text = `${Constants.LABELS[clsIdx]} (${(100 * conf).toFixed(0)})`;
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

  static hexToRgba = (hex, alpha) => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `rgba(${[parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)].join(
          ", "
        )}, ${alpha})`
      : null;
  };
}
