import { detectVideo } from "../utils/detect";
import { useState, useEffect, useCallback, useRef } from "react";
import * as Constants from "../utils/constants.js";
import Corners from "../components/corners";
import { useWindowWidth } from '@react-hook/window-size';
import * as tf from "@tensorflow/tfjs";

const Video = ({ recordingRef, setFen, setPgn }) => {
  const constraints = {
    "audio": false,
    "video": {
      "facingMode": {
        "ideal": "environment"
      },
      "width": Constants.MODEL_SIZE,
      "height": Constants.MODEL_SIZE
    }
  }
  const canvasRef = useRef(null);
  const webcamRef = useRef(null);
  const displayRef = useRef(null);
  const cornersRef = useRef({
    a8: {x: 0, y: 100},
    h8: {x: 100, y: 100},
    h1: {x: 0, y: 0},
    a1: {x: 100, y: 0}
  });
  const modelRef = useRef({ net: null });
  const windowWidth = useWindowWidth();
  const videoSize = useRef(null);

  const setupWebcam = async () => {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    webcamRef.current.srcObject = stream;
  };

  useEffect(() => {
    tf.ready().then(async () => {
      const yolov8 = await tf.loadGraphModel("480S_pruned_web_model/model.json");
      console.log("Backend:", tf.getBackend());

      modelRef.current = {
        net: yolov8,
        width: yolov8.inputs[0].shape[1],
        height: yolov8.inputs[0].shape[2]
      };
    });

    const setup = async () => {
      await setupWebcam();
    }
    setup();
    detectVideo(modelRef, webcamRef, canvasRef, cornersRef, recordingRef, videoSize, setFen, setPgn);
  }, []);

  useEffect(() => {
    const size = Math.min(Math.max(120 * Math.floor((windowWidth - 100) / 120), 240), 480);
    videoSize.current = size;
    displayRef.current.style.height = `${size}px`;
    displayRef.current.style.width = `${size}px`;
    canvasRef.current.height = size;
    canvasRef.current.width = size;
    webcamRef.current.height = size;
    webcamRef.current.width = size;
  }, [windowWidth]);

  const canvasStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    padding: 0,
    width: "100%",
    height: "100%"
  }

  return (
    <div ref={displayRef} style={{"position": "relative"}}>
      <video ref={webcamRef} autoPlay />
      <canvas ref={canvasRef} style={canvasStyle} />
      <Corners cornersRef={cornersRef} videoSize={videoSize} />
    </div>
  );
};

export default Video;

