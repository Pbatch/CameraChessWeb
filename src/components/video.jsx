import { detectVideo } from "../utils/detect";
import { useState, useEffect, useCallback } from "react";
import * as Constants from "../utils/constants.js";

const Video = ({ modelRef, webcamRef, canvasRef, cornersRef, recordingRef, setFen }) => {
  const constraints = {
    "audio": false,
    "video": {
      "facingMode": {
        "ideal": "environment"
      }
    }
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
    detectVideo(modelRef, webcamRef, canvasRef, cornersRef, recordingRef, setFen);
  }, []);

  return (
    <video ref={webcamRef} autoPlay width={Constants.VIDEO_WIDTH} height={Constants.VIDEO_HEIGHT} />
  );
};

export default Video;

