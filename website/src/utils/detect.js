import * as tf from "@tensorflow/tfjs";
import { renderBoxes } from "./renderBox";
import labels from "./labels.json";
import * as Constants from "../utils/constants.js";

const numClass = labels.length;
const getKeypoints = (cornersRef) => {
    const keypoints = [[cornersRef['h1']['x'], cornersRef['h1']['y']],
                       [cornersRef['a1']['x'], cornersRef['a1']['y']],
                       [cornersRef['a8']['x'], cornersRef['a8']['y']],
                       [cornersRef['h8']['x'], cornersRef['h8']['y']]];
    return keypoints;
}

const preprocess = (webcamRef) => {
  const input = tf.tidy(() => {
    const img = tf.browser.fromPixels(webcamRef.current);
    const imgPadded = img.pad([
      [0, Math.max(Constants.VIDEO_WIDTH, Constants.VIDEO_HEIGHT) - Constants.VIDEO_HEIGHT],
      [0, Math.max(Constants.VIDEO_WIDTH, Constants.VIDEO_HEIGHT) - Constants.VIDEO_WIDTH],
      [0, 0],
    ]);

    return tf.image
      .resizeBilinear(imgPadded, [Constants.MODEL_WIDTH, Constants.MODEL_HEIGHT])
      .div(255.0)
      .expandDims(0);
  });

  return input;
};

const detectFrame = async (modelRef, webcamRef, canvasRef, cornersRef, recordingRef, preds, tracker_output, setFen) => {

  if (recordingRef.current === false || webcamRef.current.srcObject == null) {
      preds = [];
      tracker_output.tracker = "";
      canvasRef.current.getContext("2d").clearRect(0, 0, Constants.MODEL_WIDTH, Constants.MODEL_HEIGHT);
    } else {
      const input = preprocess(webcamRef);

      const res = modelRef.current.net.execute(input);

      const [boxes, scores, classes] = tf.tidy(() => {
        const transRes = res.transpose([0, 2, 1]);
        const w = transRes.slice([0, 0, 2], [-1, -1, 1]);
        const h = transRes.slice([0, 0, 3], [-1, -1, 1]);
        const x = tf.sub(transRes.slice([0, 0, 0], [-1, -1, 1]), tf.div(w, 2));
        const y = tf.sub(transRes.slice([0, 0, 1], [-1, -1, 1]), tf.div(h, 2));
        const boxes = tf.concat([y, x, tf.add(y, h), tf.add(x, w)], 2).squeeze();
        const rawScores = transRes.slice([0, 0, 4], [-1, -1, numClass]).squeeze();
        const scores = rawScores.max(1);
        const classes = rawScores.argMax(1);

        return [boxes, scores, classes];
      })

      const nms = await tf.image.nonMaxSuppressionAsync(boxes, scores, 500, 0.45, 0.1);

      const bbox_conf_cls = tf.tidy(() => {
        const boxes_data = boxes.gather(nms, 0);
        const scores_data = scores.gather(nms, 0);
        const classes_data = classes.gather(nms, 0);
        const y1 = tf.mul(boxes_data.slice([0, 0], [-1, 1]), tf.scalar(Constants.Y_RATIO));
        const x1 = tf.mul(boxes_data.slice([0, 1], [-1, 1]), tf.scalar(Constants.X_RATIO));
        const y2 = tf.mul(boxes_data.slice([0, 2], [-1, 1]), tf.scalar(Constants.Y_RATIO));
        const x2 = tf.mul(boxes_data.slice([0, 3], [-1, 1]), tf.scalar(Constants.X_RATIO));
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

      if (preds.length === 8) {
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
        tracker_output = await fetch("https://zht7adkgfc.execute-api.eu-west-2.amazonaws.com/prod/tracker", {
          method: 'POST',
          body: body,
        }).then(response => response.json())
        renderBoxes(canvasRef.current, tracker_output.tracks);
        setFen(tracker_output.fen);
        console.log(tracker_output.fen, tracker_output.last_move)

        preds.length = 0;
      }
    }

    return tracker_output;
  }

export const detectVideo = (modelRef, webcamRef, canvasRef, cornersRef, recordingRef, setFen) => {
  let preds = [];
  let tracker_output = {"tracker": "",
                        "state": "",
                        "tracks": [],
                        "fen": "",
                        "last_move": ""}

  console.log("modelRef", modelRef)
  console.log("webcamRef", webcamRef)
  console.log("canvasRef", canvasRef)
  console.log("cornersRef", cornersRef)
  console.log("recordingRef", recordingRef)
  const loop = async () => {
    tracker_output = await detectFrame(modelRef, webcamRef, canvasRef, cornersRef, recordingRef, preds, tracker_output, setFen);
    requestAnimationFrame(loop);
  }
  loop()

  return () => {
    tf.disposeVariables();
  };
};
