import * as Constants from "./constants.jsx";
import * as tf from "@tensorflow/tfjs";

export const getInput = (webcamRef, keypoints) => {
  let roi;
  if (false) {
    const padding = [50, 100, 50, 10];
    const xs = keypoints.map(p => p[0]);
    const ys = keypoints.map(p => p[1]);
    roi = [
      Math.max((Math.min(...xs) - padding[0]) / Constants.MODEL_SIZE, 0.0),
      Math.max((Math.min(...ys) - padding[1]) / Constants.MODEL_SIZE, 0.0),
      Math.min((Math.max(...xs) + padding[2]) / Constants.MODEL_SIZE, 1.0),
      Math.min((Math.max(...ys) + padding[3]) / Constants.MODEL_SIZE, 1.0)
    ]
  } else {
    roi = [0.0, 0.0, 1.0, 1.0]
  }
  const [input, originalWidth, originalHeight, width, height] = tf.tidy(() => {
    const img = tf.browser.fromPixels(webcamRef.current)
    const [originalHeight, originalWidth, _] = img.shape;
    const croppedImg = img.slice(
      [Math.round(originalHeight * roi[1]), Math.round(originalWidth * roi[0]), 0], 
      [Math.round(originalHeight * (roi[3] - roi[1])), Math.round(originalWidth * (roi[2] - roi[0])), 
      3]
    );
    const [height, width, __] = croppedImg.shape;
    const imgPadded = croppedImg.pad([
      [0, Math.max(width, height) - height],
      [0, Math.max(width, height) - width],
      [0, 0],
    ]);
    const input = tf.image
      .resizeBilinear(imgPadded, [Constants.MODEL_SIZE, Constants.MODEL_SIZE])
      .div(255.0)
      .expandDims(0);
    return [input, originalWidth, originalHeight, width, height];
  });
  return [input, width, height, roi, originalWidth, originalHeight]
};

export const getBoxesAndScores = (width, height, preds) => {
  const sx = Math.max(width, height) / width;
  const sy = Math.max(width, height) / height;

  const [boxes, scores] = tf.tidy(() => {
    const transRes = preds.transpose([0, 2, 1]);
    const w = transRes.slice([0, 0, 2], [-1, -1, 1]).mul(sx);
    const h = transRes.slice([0, 0, 3], [-1, -1, 1]).mul(sy);
    const x = tf.sub(transRes.slice([0, 0, 0], [-1, -1, 1]).mul(sx), tf.div(w, 2));
    const y = tf.sub(transRes.slice([0, 0, 1], [-1, -1, 1]).mul(sy), tf.div(h, 2));
    let boxes = tf.concat([
      x, 
      y, 
      tf.add(x, w), 
      tf.add(y, h)
    ], 2).squeeze();
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