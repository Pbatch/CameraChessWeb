import { useState, useEffect, useRef, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import RecordButton from "./components/recordButton";
import Corners from "./components/corners";
import Video from "./components/video";
import Board from "./components/board"
import * as Constants from "./utils/constants.js";
import "./style/App.css";

const App = () => {
  const [recording, setRecording] = useState(false);
  const [fen, setFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1");

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const recordingRef = useRef(false);
  const cornersRef = useRef({
    a8: {x: 0, y: 100},
    h8: {x: 100, y: 100},
    h1: {x: 0, y: 0},
    a1: {x: 100, y: 0}
  })
  const modelRef = useRef({
    net: null
  });

  useEffect(() => {
    tf.ready().then(async () => {
      const yolov8 = await tf.loadGraphModel("480S_web_model/model.json");

      modelRef.current = {
        net: yolov8,
        width: yolov8.inputs[0].shape[1],
        height: yolov8.inputs[0].shape[2]
      };

    });
  }, []);

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  return (
    <div id="App">
      <div id="video" display="flex">
          <Video modelRef={modelRef} webcamRef={webcamRef} canvasRef={canvasRef}
          cornersRef={cornersRef} recordingRef={recordingRef} setFen={setFen} />
          <canvas ref={canvasRef} height={Constants.MODEL_HEIGHT} width={Constants.MODEL_WIDTH} />
          <Corners cornersRef={cornersRef} />
      </div>

      <div id="buttons">
        <RecordButton recording={recording} setRecording={setRecording} />
      </div>

      <div id="board">
         <Board fen={fen} />
      </div>


    </div>
  );
};

export default App;
