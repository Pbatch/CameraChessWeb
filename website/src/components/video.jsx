import { detectVideo } from "../utils/detect";
import { useState, useEffect, useCallback, useRef } from "react";
import * as Constants from "../utils/constants.js";

const Video = ({ modelRef, cornersRef, recordingRef, setFen, setLichessURL, videoSize }) => {
  const canvasRef = useRef(null);
  const webcamRef = useRef(null);

  const canvasStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    padding: 0,
    width: "100%",
    height: "100%"
  }

  const constraints = {
    "audio": false,
    "video": {
      "facingMode": {
        "ideal": "environment"
      }
    },
    "width": Constants.MODEL_WIDTH,
    "height": Constants.MODEL_HEIGHT
  }

  const setupWebcam = async () => {
    console.log(constraints);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    webcamRef.current.srcObject = stream;
  };

  useEffect(() => {
    const setup = async () => {
      await setupWebcam();
    }
    setup();
    detectVideo(modelRef, webcamRef, canvasRef, cornersRef, recordingRef, setFen, setLichessURL);
    canvasRef.current.height = videoSize;
    canvasRef.current.width = videoSize;
  }, []);

  return (
    <>
      <video ref={webcamRef} autoPlay />
      <canvas ref={canvasRef} style={canvasStyle} />
    </>
  );
};

export default Video;

