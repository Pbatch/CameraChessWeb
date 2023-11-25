import * as Constants from "./constants.jsx";
import * as tf from "@tensorflow/tfjs";

export const getInput = (webcamRef) => {
  const [input, width, height] = tf.tidy(() => {
    const img = tf.browser.fromPixels(webcamRef.current);
    const [height, width, _] = img.shape;
    const imgPadded = img.pad([
      [0, Math.max(width, height) - height],
      [0, Math.max(width, height) - width],
      [0, 0],
    ]);
    const input = tf.image
      .resizeBilinear(imgPadded, [Constants.MODEL_SIZE, Constants.MODEL_SIZE])
      .div(255.0)
      .expandDims(0);
    return [input, width, height];
  });
  return [input, width, height]
};

export const getBoxesAndScores = (width, height, preds) => {
  const [boxes, scores] = tf.tidy(() => {
    const sx = Math.max(width, height) / width;
    const sy = Math.max(width, height) / height;
    const transRes = preds.transpose([0, 2, 1]);
    const w = transRes.slice([0, 0, 2], [-1, -1, 1]).mul(sx);
    const h = transRes.slice([0, 0, 3], [-1, -1, 1]).mul(sy);
    const x = tf.sub(transRes.slice([0, 0, 0], [-1, -1, 1]).mul(sx), tf.div(w, 2));
    const y = tf.sub(transRes.slice([0, 0, 1], [-1, -1, 1]).mul(sy), tf.div(h, 2));
    let boxes = tf.concat([x, y, tf.add(x, w), tf.add(y, h)], 2).squeeze();
    let scores = transRes.slice([0, 0, 4], [-1, -1, transRes.shape[2] - 4]).squeeze();

    return [boxes, scores];
  });
  return [boxes, scores];
} 

export const getCenters = (boxes) => {
  const centers = tf.tidy(() => {
    const l = boxes.slice([0, 0], [-1, 1]);
    const t = boxes.slice([0, 1], [-1, 1]);
    const r = boxes.slice([0, 2], [-1, 1]);
    const b = boxes.slice([0, 3], [-1, 1]);
    const cx = l.add(r).div(2);
    const cy = t.add(b).div(2);
    const centers = tf.concat([cx, cy], 1);
    return centers;
  })
  return centers;
}

export const getMarkerXY = (xy, height, width) => {
  const sx = width / Constants.MODEL_SIZE;
  const sy = height / Constants.MODEL_SIZE;
  const markerXY = [sx * xy[0], sy * xy[1] - height - Constants.MARKER_DIAMETER];
  return markerXY
}

export const getXY = (markerXY, height, width) => {
  const sx = Constants.MODEL_SIZE / width;
  const sy = Constants.MODEL_SIZE / height;
  const XY = [sx * markerXY[0], sy * (markerXY[1] + height + Constants.MARKER_DIAMETER)]
  return XY 
}