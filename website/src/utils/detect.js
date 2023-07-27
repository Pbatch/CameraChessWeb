import * as tf from "@tensorflow/tfjs-core";
import { renderBoxes } from "./renderBox";
import * as Constants from "../utils/constants.js";

const getKeypoints = (cornersRef) => {
    const keypoints = [[cornersRef['h1']['x'], cornersRef['h1']['y']],
                       [cornersRef['a1']['x'], cornersRef['a1']['y']],
                       [cornersRef['a8']['x'], cornersRef['a8']['y']],
                       [cornersRef['h8']['x'], cornersRef['h8']['y']]];
    return keypoints;
}

const detect = async (modelRef, webcamRef) => {
  let preds = [];
  for (let i = 0; i < Constants.BATCH_SIZE; i++) {
    const input = tf.tidy(() => {
      const image = tf.browser.fromPixels(webcamRef.current).div(255.0).expandDims(0);
      return image
    });
    const res = modelRef.current.net.predict(input);

    const [boxes, scores, classes] = tf.tidy(() => {
      const transRes = res.transpose([0, 2, 1]);
      const w = transRes.slice([0, 0, 2], [-1, -1, 1]);
      const h = transRes.slice([0, 0, 3], [-1, -1, 1]);
      const x = tf.sub(transRes.slice([0, 0, 0], [-1, -1, 1]), tf.div(w, 2));
      const y = tf.sub(transRes.slice([0, 0, 1], [-1, -1, 1]), tf.div(h, 2));
      const boxes = tf.concat([y, x, tf.add(y, h), tf.add(x, w)], 2).squeeze();
      const rawScores = transRes.slice([0, 0, 4], [-1, -1, transRes.shape[2] - 4]).squeeze();
      const scores = rawScores.max(1);
      const classes = rawScores.argMax(1);

      return [boxes, scores, classes];
    })

    const nms = await tf.image.nonMaxSuppressionAsync(boxes, scores, 500, 0.45, 0.1);

    const bbox_conf_cls = tf.tidy(() => {
      const boxes_data = boxes.gather(nms, 0);
      const scores_data = scores.gather(nms, 0);
      const classes_data = classes.gather(nms, 0);
      const y1 = boxes_data.slice([0, 0], [-1, 1]);
      const x1 = boxes_data.slice([0, 1], [-1, 1]);
      const y2 = boxes_data.slice([0, 2], [-1, 1]);
      const x2 = boxes_data.slice([0, 3], [-1, 1]);
      const xyxy = tf.concat([x1, y1, x2, y2], 1);
      const output = tf.concat([xyxy, scores_data.expandDims(1), classes_data.expandDims(1)], 1).dataSync();

      return output;
    });

    tf.dispose([input, res, boxes, scores, classes, nms]);

    let arr = []
    for (let i=0; i < bbox_conf_cls.length / 6; i++) {
      arr.push(Array.from(bbox_conf_cls.slice(6 * i, 6 * (i + 1))));
    }
    preds.push(arr);
  }
  return preds;
}

const track = async (preds, tracker_output, cornersRef) => {
  var body;
  if (tracker_output.tracker === "") {
    body = JSON.stringify({
      "preds": preds,
      "tracker_kwargs":
        {"fps": 10,
        "keypoints": getKeypoints(cornersRef.current),
        "new_track_thresh": 0.3,
        "track_high_thresh": 0.3,
        "track_low_thresh": 0.1},
      "state_kwargs": {"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}
    })
  } else {
    body = JSON.stringify({
      "preds": preds,
      "tracker": tracker_output.tracker,
      "state": tracker_output.state
    })
  }

  // Block here
  tracker_output = await fetch("https://k1vdoq111c.execute-api.eu-west-2.amazonaws.com/prod/tracker", {
    method: 'POST',
    body: body,
  }).then(response => response.json())

  return tracker_output;
}

export const detectVideo = (modelRef, webcamRef, canvasRef, cornersRef, recordingRef, setFen, setLichessURL) => {
  let tracker_output = {"tracker": "",
                        "state": "",
                        "tracks": [],
                        "fen": "",
                        "lichess_url": ""}

  console.log("modelRef", modelRef)
  console.log("webcamRef", webcamRef)
  console.log("canvasRef", canvasRef)
  console.log("cornersRef", cornersRef)
  console.log("recordingRef", recordingRef)
  const loop = async () => {
    if (recordingRef.current === false || webcamRef.current.srcObject == null) {
      tracker_output.tracker = "";
      canvasRef.current.getContext("2d").clearRect(0, 0, Constants.MODEL_WIDTH, Constants.MODEL_HEIGHT);
    } else {
      const startTime = performance.now();
      const preds = await detect(modelRef, webcamRef);
      tracker_output = await track(preds, tracker_output, cornersRef);
      const endTime = performance.now();
      const fps = (Constants.BATCH_SIZE * 1000 / (endTime - startTime)).toFixed(2);
      renderBoxes(canvasRef.current, tracker_output.tracks, fps);
      setFen(tracker_output.fen);
      setLichessURL(tracker_output.lichess_url);

      console.log(tracker_output.fen);
    }
    requestAnimationFrame(loop);
  }
  loop()

  return () => {
    tf.disposeVariables();
  };
};
