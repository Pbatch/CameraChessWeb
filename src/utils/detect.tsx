import { MODEL_WIDTH, MODEL_HEIGHT, MARKER_DIAMETER } from "./constants";
import * as tf from "@tensorflow/tfjs-core";

export const invalidVideo = (videoRef: any) => {
  if (videoRef.current === null) {
    return true;
  }

  if (videoRef.current.autoplay) {
    // Record check
    if (videoRef.current?.srcObject === null) {
      return true;
    }
  } else {
    // Upload check
    const src = videoRef.current?.src;
    if (src === null) {
      return true;
    }

    if (!(src.startsWith("blob"))) {
      return true;
    }
  }

  return false;
}

export const getInput = (videoRef: any, keypoints: number[][] | null=null, paddingRatio: number=12): {
  image4D: tf.Tensor4D, width: number, height: number, padding: number[], roi: number[]
} => {
  let roi: number[];
  const videoWidth: number = videoRef.current.videoWidth;
  const videoHeight: number = videoRef.current.videoHeight;
  if (keypoints !== null) {
    const xs: number[] = keypoints.map(p => p[0]);
    const ys: number[] = keypoints.map(p => p[1]);
    const xmin: number = Math.min(...xs);
    const xmax: number = Math.max(...xs);
    const ymin: number = Math.min(...ys);
    const ymax: number = Math.max(...ys)

    const roiWidth: number = xmax - xmin;
    const roiHeight: number = ymax - ymin;
    let paddingLeft: number = Math.floor(roiWidth / paddingRatio);
    let paddingRight: number = Math.floor(roiWidth / paddingRatio);
    let paddingTop: number = Math.floor(roiHeight / paddingRatio);
    const paddingBottom: number = Math.floor(roiHeight / paddingRatio)

    const paddedRoiWidth: number = roiWidth + paddingLeft + paddingRight;
    const paddedRoiHeight: number = roiHeight + paddingTop + paddingBottom;
    const ratio: number = paddedRoiHeight / paddedRoiWidth;
    const desiredRatio: number = MODEL_HEIGHT / MODEL_WIDTH;

    if (ratio > desiredRatio) {
        const targetWidth: number = paddedRoiHeight / desiredRatio;
        const dx: number = targetWidth - paddedRoiWidth;
        paddingLeft += Math.floor(dx / 2);
        paddingRight += dx - Math.floor(dx / 2);
    } else {
        const targetHeight: number = paddedRoiWidth * desiredRatio;
        paddingTop += targetHeight - paddedRoiHeight;
    }
    roi = [Math.round(Math.max(videoWidth * (xmin - paddingLeft) / MODEL_WIDTH, 0)),
      Math.round(Math.max(videoHeight * (ymin - paddingTop) / MODEL_HEIGHT, 0)),
      Math.round(Math.min(videoWidth * (xmax + paddingRight) / MODEL_WIDTH, videoWidth)),
      Math.round(Math.min(videoHeight * (ymax + paddingBottom) / MODEL_HEIGHT, videoHeight))]
  } else {
    roi = [0, 0, videoWidth, videoHeight];
  }
  const [image4D, width, height, padding]: [tf.Tensor4D, number, number, number[]] = tf.tidy(() => {
    let image: tf.Tensor3D = tf.browser.fromPixels(videoRef.current);
    
    // Cropping
    image = tf.slice(image,
      [roi[1], roi[0], 0], 
      [roi[3] - roi[1], roi[2] - roi[0], 3]
    );
    const height: number = image.shape[0];
    const width: number = image.shape[1];
    
    // Resizing
    const ratio: number = height / width;
    const desiredRatio: number = MODEL_HEIGHT / MODEL_WIDTH;
    let resizeHeight: number = MODEL_HEIGHT;
    let resizeWidth: number = MODEL_WIDTH;
    if (ratio > desiredRatio) {
      resizeWidth = Math.round(MODEL_HEIGHT / ratio); 
    } else {
      resizeHeight = Math.round(MODEL_WIDTH * ratio);
    }
    image = tf.image.resizeBilinear(image, [resizeHeight, resizeWidth]);
    
    // Padding
    const dx: number = MODEL_WIDTH - image.shape[1];
    const dy: number = MODEL_HEIGHT - image.shape[0];
    const padRight: number = Math.floor(dx / 2);
    const padLeft: number = dx - padRight
    const padBottom: number = Math.floor(dy / 2);
    const padTop: number = dy - padBottom;
    const padding: number[] = [padLeft, padRight, padTop, padBottom]
    image = tf.pad(image, [
      [padTop, padBottom],
      [padLeft, padRight],
      [0, 0]
    ], 114);
    
    // Transpose + scale + expand
    const image4D: tf.Tensor4D = tf.expandDims(tf.div(tf.transpose(image, [0, 1, 2]), 255.0), 0);

    return [image4D, width, height, padding];
  });
  return {image4D, width, height, padding, roi}
};

export const getBoxesAndScores = (preds: tf.Tensor3D, width: number, height: number, 
  videoWidth: number, videoHeight: number, padding: number[], roi: number[]): {
    boxes: tf.Tensor2D, scores: tf.Tensor2D
  } => {
  const {boxes, scores} = tf.tidy(() => {

    const transRes: tf.Tensor3D = tf.transpose(preds, [0, 2, 1]);
    const w: tf.Tensor3D = tf.slice(transRes, [0, 0, 2], [-1, -1, 1]);
    const h: tf.Tensor3D = tf.slice(transRes, [0, 0, 3], [-1, -1, 1]);
    
    // xc, yc, w, h -> l, t, r, b
    let l: tf.Tensor2D = tf.sub(tf.slice(transRes, [0, 0, 0], [-1, -1, 1]), tf.div(w, 2));
    let t: tf.Tensor2D = tf.sub(tf.slice(transRes, [0, 0, 1], [-1, -1, 1]), tf.div(h, 2));
    let r: tf.Tensor2D = tf.add(l, w);
    let b: tf.Tensor2D = tf.add(t, h);
    
    // Remove padding
    l = tf.sub(l, padding[0]);
    r = tf.sub(r, padding[0]);
    t = tf.sub(t, padding[2]);
    b = tf.sub(b, padding[2]);

    // Scale
    l = tf.mul(l, width / (MODEL_WIDTH - padding[0] - padding[1]));
    r = tf.mul(r, width / (MODEL_WIDTH - padding[0] - padding[1]));
    t = tf.mul(t, height / (MODEL_HEIGHT - padding[2] - padding[3]));
    b = tf.mul(b, height / (MODEL_HEIGHT - padding[2] - padding[3]));

    // Add ROI
    l = tf.add(l, roi[0]);
    r = tf.add(r, roi[0]);
    t = tf.add(t, roi[1]);
    b = tf.add(b, roi[1]);

    // Scale
    l = tf.mul(l, MODEL_WIDTH / videoWidth);
    r = tf.mul(r, MODEL_WIDTH / videoWidth);
    t = tf.mul(t, MODEL_HEIGHT / videoHeight);
    b = tf.mul(b, MODEL_HEIGHT / videoHeight);

    const boxes: tf.Tensor2D = tf.squeeze(tf.concat([l, t, r, b], 2));
    const scores: tf.Tensor2D = tf.squeeze(tf.slice(transRes, [0, 0, 4], [-1, -1, transRes.shape[2] - 4]), [0]);

    return {boxes, scores};
  });
  return {boxes, scores};
} 

export const getCenters = (boxes: tf.Tensor2D) => {
  const centers: tf.Tensor2D = tf.tidy(() => {
    const l: tf.Tensor2D = tf.slice(boxes, [0, 0], [-1, 1]);
    const t: tf.Tensor2D = tf.slice(boxes, [0, 1], [-1, 1]);
    const r: tf.Tensor2D = tf.slice(boxes, [0, 2], [-1, 1]);
    const b: tf.Tensor2D = tf.slice(boxes, [0, 3], [-1, 1]);
    const cx: tf.Tensor2D = tf.div(tf.add(l, r), 2);
    const cy: tf.Tensor2D = tf.div(tf.add(t, b), 2);
    const centers: tf.Tensor2D = tf.concat([cx, cy], 1);
    return centers;
  })
  return centers;
}

export const getMarkerXY = (xy: number[], height: number, width: number) => {
  const sx: number = width / MODEL_WIDTH;
  const sy: number = height / MODEL_HEIGHT;
  const markerXY: number[] = [sx * xy[0], sy * xy[1] - height - MARKER_DIAMETER];
  return markerXY
}

export const getXY = (markerXY: number[], height: number, width: number) => {
  const sx: number = MODEL_WIDTH / width;
  const sy: number = MODEL_HEIGHT / height;
  const XY: number[] = [sx * markerXY[0], sy * (markerXY[1] + height + MARKER_DIAMETER)]
  return XY 
}