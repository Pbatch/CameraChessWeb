import { findPieces } from "../../utils/findPieces";
import { useEffect, useRef } from "react";
import { CORNER_KEYS, MARKER_DIAMETER, MARKER_RADIUS } from "../../utils/constants";
import { Corners } from "../common";
import { useWindowWidth, useWindowHeight } from '@react-hook/window-size';
import { useDispatch, useSelector } from 'react-redux';
import { cornersSet } from "../../slices/cornersSlice";
import { getMarkerXY, getXY } from "../../utils/detect";
import { Chessboard } from 'kokopu-react';
import { CornersPayload, RootState } from "../../types";

const Video = ({ modelRef, canvasRef, webcamRef, sidebarRef, recordingRef, setText, digital }: {
  modelRef: any, canvasRef: any, webcamRef: any, sidebarRef: any, recordingRef: any,
  setText: React.Dispatch<React.SetStateAction<string[]>>, digital: boolean
}) => {
  const aspectRatio = 16 / 9;
  const constraints = {
    "audio": false,
    "video": {
      "facingMode": {
        "ideal": "environment"
      },
      "width": {
        "ideal": 1000
      },
      "aspectRatio": aspectRatio
    }
  }
  const displayRef: any = useRef(null);
  const cornersRef: any = useRef(null);
  const windowWidth = useWindowWidth();
  const windowHeight = useWindowHeight();
  const dispatch = useDispatch();
  const corners = useSelector((state: RootState) => state.corners["value"]);
  const fen = useSelector((state: RootState) => state.fen["value"]);

  const setupWebcam = async () => {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    if (webcamRef.current !== null) {
      webcamRef.current.srcObject = stream;
    }
  };

  const updateWidthHeight = () => {
    if ((canvasRef.current.offsetHeight == 0) || (canvasRef.current.offsetWidth) == 0) {
      return;
    }

    let height = ((windowWidth - sidebarRef.current.offsetWidth - MARKER_DIAMETER) 
    / aspectRatio) + MARKER_DIAMETER;
    if (height > windowHeight) {
      height = windowHeight;
    }
    const width: number = ((height - MARKER_DIAMETER) * aspectRatio) + MARKER_DIAMETER;
    const oldHeight: number = canvasRef.current.height;
    const oldWidth: number = canvasRef.current.width;

    displayRef.current.style.width = `${width}px`;
    displayRef.current.style.height = `${height}px`;
    displayRef.current.width = width;
    displayRef.current.height = height;

    canvasRef.current.width = webcamRef.current.offsetWidth;
    canvasRef.current.height = webcamRef.current.offsetHeight;
    
    CORNER_KEYS.forEach((key) => {
      const xy = getXY(corners[key], oldHeight, oldWidth);
      const payload: CornersPayload = {
        "xy": getMarkerXY(xy, canvasRef.current.height, canvasRef.current.width),
        "key": key
      }
      dispatch(cornersSet(payload)) 
    })
  }

  useEffect(() => {
    updateWidthHeight();

    const setup = async () => {
      await setupWebcam();
    }
    setup();
    findPieces(modelRef, webcamRef, canvasRef, recordingRef, setText, dispatch, cornersRef);
  }, []);

  useEffect(() => {
    updateWidthHeight();
  }, [windowWidth, windowHeight]);

  useEffect(() => {
    cornersRef.current = corners
  }, [corners])

  const canvasStyle: React.CSSProperties = {
    position: "absolute",
    left: MARKER_RADIUS,
    top: MARKER_RADIUS
  }

  const videoContainerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    padding: MARKER_RADIUS
  }

  const videoStyle: React.CSSProperties = {
    width: "100%",
    height: "100%"
  }

  const liveStyle: React.CSSProperties = {
    position: "relative",
    backgroundColor: "#343a40",
    display: digital ? "none": "inline-block"
  }

  const digitalStyle = {
    display: digital ? "inline-block": "none"
  }

  const onLoadedMetadata = () => {  
    window.setTimeout(() => {
      if (!(webcamRef.current)) {
        return;
      }
      
      const tracks = webcamRef.current.srcObject.getVideoTracks();
      if (tracks.length == 0) {
        return;
      }
      
      const capabilities = tracks[0].getCapabilities();
      console.info(capabilities);

      if (capabilities.zoom) {
        tracks[0].applyConstraints({
          zoom: capabilities.zoom.min,
        })
        .catch((e: any) => console.log(e));
      }
    }, 2000);
  };

  return (
    <div className="d-flex align-items-center justify-content-center">
      <div ref={displayRef} style={liveStyle} >
        <div style={videoContainerStyle} >
          <video ref={webcamRef} autoPlay={true} playsInline={true} muted={true}
          onLoadedMetadata={onLoadedMetadata} style={videoStyle} />
          <canvas ref={canvasRef} style={canvasStyle} />
        </div>
        <Corners />
      </div>
      <div style={digitalStyle} >
        <Chessboard position={fen} squareSize={40} />
      </div>
    </div>
  );
};

export default Video;

