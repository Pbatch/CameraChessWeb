import { MODEL_WIDTH, MODEL_HEIGHT, MARKER_DIAMETER } from "./constants.jsx";
import { tidy, browser, slice, pad, expandDims, transpose, div, sub, add, mul, squeeze, concat } from "@tensorflow/tfjs-core";

export const invalidWebcam = (webcamRef) => {
  if (webcamRef.current === null) {
    return true;
  }

  // If it's uploaded video, the src must start with "blob"
  if (webcamRef.current.autoplay === false && !(webcamRef.current.src.startsWith("blob"))) {
    return true
  }

  // srcObject is used for recording, src is used for uploading
  if (webcamRef.current?.srcObject === null && webcamRef.current?.src === null) {
    return true;
  }

  return false;
}

export const getInput = (webcamRef, keypoints, paddingRatio=12) => {
  let roi;
  const videoWidth = webcamRef.current.videoWidth;
  const videoHeight = webcamRef.current.videoHeight;
  if (keypoints !== undefined) {
    const xs = keypoints.map(p => p[0]);
    const ys = keypoints.map(p => p[1]);
    const xmin = Math.min(...xs);
    const xmax = Math.max(...xs);
    const ymin = Math.min(...ys);
    const ymax = Math.max(...ys)

    const roiWidth = xmax - xmin;
    const roiHeight = ymax - ymin;
    let paddingLeft = Math.floor(roiWidth / paddingRatio);
    let paddingRight = Math.floor(roiWidth / paddingRatio);
    let paddingTop = Math.floor(roiHeight / paddingRatio);
    let paddingBottom = Math.floor(roiHeight / paddingRatio)

    const paddedRoiWidth = roiWidth + paddingLeft + paddingRight;
    const paddedRoiHeight = roiHeight + paddingTop + paddingBottom;
    const ratio = paddedRoiHeight / paddedRoiWidth;
    const desiredRatio = MODEL_HEIGHT / MODEL_WIDTH;

    if (ratio > desiredRatio) {
        const targetWidth = paddedRoiHeight / desiredRatio;
        const dx = targetWidth - paddedRoiWidth;
        paddingLeft += Math.floor(dx / 2);
        paddingRight += dx - Math.floor(dx / 2);
    } else {
        const targetHeight = paddedRoiWidth * desiredRatio;
        paddingTop += targetHeight - paddedRoiHeight;
    }
    roi = [Math.round(Math.max(videoWidth * (xmin - paddingLeft) / MODEL_WIDTH, 0)),
      Math.round(Math.max(videoHeight * (ymin - paddingTop) / MODEL_HEIGHT, 0)),
      Math.round(Math.min(videoWidth * (xmax + paddingRight) / MODEL_WIDTH, videoWidth)),
      Math.round(Math.min(videoHeight * (ymax + paddingBottom) / MODEL_HEIGHT, videoHeight))]
  } else {
    roi = [0, 0, videoWidth, videoHeight];
  }
  const [image, width, height, padding] = tidy(() => {
    let image = browser.fromPixels(webcamRef.current)
    
    // Cropping
    image = slice(image,
      [roi[1], roi[0], 0], 
      [roi[3] - roi[1], roi[2] - roi[0], 3]
    );
    const [height, width] = image.shape;
    
    // Resizing
    const ratio = height / width;
    const desiredRatio = MODEL_HEIGHT / MODEL_WIDTH;
    let resizeHeight = MODEL_HEIGHT;
    let resizeWidth = MODEL_WIDTH;
    if (ratio > desiredRatio) {
      resizeWidth = Math.round(MODEL_HEIGHT / ratio); 
    } else {
      resizeHeight = Math.round(MODEL_WIDTH * ratio);
    }
    image = image.resizeBilinear(image, [resizeHeight, resizeWidth]);
    
    // Padding
    const dx = MODEL_WIDTH - image.shape[1];
    const dy = MODEL_HEIGHT - image.shape[0];
    const padRight = Math.floor(dx / 2);
    const padLeft = dx - padRight
    const padBottom = Math.floor(dy / 2);
    const padTop = dy - padBottom;
    const padding = [padLeft, padRight, padTop, padBottom]
    image = pad(image, [
      [padTop, padBottom],
      [padLeft, padRight],
      [0, 0]
    ], 114);
    
    // Transpose + scale + expand
    image = expandDims(div(transpose(image, [0, 1, 2]), 255.0), 0);

    return [image, width, height, padding];
  });
  return [image, width, height, padding, roi]
};

export const getBoxesAndScores = (preds, width, height, videoWidth, videoHeight, padding, roi) => {
  const [boxes, scores] = tidy(() => {

    const transRes = transpose(preds, [0, 2, 1]);
    const w = slice(transRes, [0, 0, 2], [-1, -1, 1]);
    const h = slice(transRes, [0, 0, 3], [-1, -1, 1]);
    
    // xc, yc, w, h -> l, t, r, b
    let l = sub(slice(transRes, [0, 0, 0], [-1, -1, 1]), div(w, 2));
    let t = sub(slice(transRes, [0, 0, 1], [-1, -1, 1]), div(h, 2));
    let r = add(l, w);
    let b = add(t, h);
    
    // Remove padding
    l = sub(l, padding[0]);
    r = sub(r, padding[0]);
    t = sub(t, padding[2]);
    b = sub(b, padding[2]);

    // Scale
    l = mul(l, width / (MODEL_WIDTH - padding[0] - padding[1]));
    r = mul(r, width / (MODEL_WIDTH - padding[0] - padding[1]));
    t = mul(t, height / (MODEL_HEIGHT - padding[2] - padding[3]));
    b = mul(b, height / (MODEL_HEIGHT - padding[2] - padding[3]));

    // Add ROI
    l = add(l, roi[0]);
    r = add(r, roi[0]);
    t = add(t, roi[1]);
    b = add(b, roi[1]);

    // Scale
    l = mul(l, MODEL_WIDTH / videoWidth);
    r = mul(r, MODEL_WIDTH / videoWidth);
    t = mul(t, MODEL_HEIGHT / videoHeight);
    b = mul(b, MODEL_HEIGHT / videoHeight);

    let boxes = squeeze(concat([l, t, r, b], 2));
    let scores = squeeze(slice(transRes, [0, 0, 4], [-1, -1, transRes.shape[2] - 4]));

    return [boxes, scores];
  });
  return [boxes, scores];
} 

export const getCenters = (boxes) => {
  const centers = tidy(() => {
    const l = slice(boxes, [0, 0], [-1, 1]);
    const t = slice(boxes, [0, 1], [-1, 1]);
    const r = slice(boxes, [0, 2], [-1, 1]);
    const b = slice(boxes, [0, 3], [-1, 1]);
    const cx = div(add(l, r), 2);
    const cy = div(add(t, b), 2);
    const centers = concat([cx, cy], 1);
    return centers;
  })
  return centers;
}

export const getMarkerXY = (xy, height, width) => {
  const sx = width / MODEL_WIDTH;
  const sy = height / MODEL_HEIGHT;
  const markerXY = [sx * xy[0], sy * xy[1] - height - MARKER_DIAMETER];
  return markerXY
}

export const getXY = (markerXY, height, width) => {
  const sx = MODEL_WIDTH / width;
  const sy = MODEL_HEIGHT / height;
  const XY = [sx * markerXY[0], sy * (markerXY[1] + height + MARKER_DIAMETER)]
  return XY 
}