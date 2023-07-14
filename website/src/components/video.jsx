import { detectVideo } from "../utils/detect";
import { useState, useEffect, useCallback } from "react";
import * as Constants from "../utils/constants.js";

const Video = ({ modelRef, webcamRef, canvasRef, cornersRef, recordingRef, setFen, setLichessURL }) => {
  const constraints = {
    "audio": false,
    "video": {
      "facingMode": {
        "ideal": "environment"
      },
     "width": Constants.MODEL_WIDTH,
     "height": Constants.MODEL_HEIGHT
    }
  }

  const canvasStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    padding: 0,
    width: "100%",
    height: "100%"
  }

  const setupWebcam = async () => {
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    webcamRef.current.srcObject = stream;
  };

  useEffect(() => {
    const setup = async () => {
      await setupWebcam();
    }
    setup();
    detectVideo(modelRef, webcamRef, canvasRef, cornersRef, recordingRef, setFen, setLichessURL);
  }, []);

  return (
    <>
      <video ref={webcamRef} autoPlay />
      <canvas ref={canvasRef} style={canvasStyle} height={Constants.MODEL_HEIGHT} width={Constants.MODEL_WIDTH} />
    </>
  );
};

export default Video;

