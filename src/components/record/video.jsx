import { findPieces } from "../../utils/findPieces.jsx";
import { useEffect, useRef, useLayoutEffect } from "react";
import * as Constants from "../../utils/constants.jsx";
import Corners from "./corners";
import { useWindowWidth } from '@react-hook/window-size';
import { useDispatch, useSelector } from 'react-redux';
import { cornersSet } from "../../slices/cornersSlice.jsx";
import { getMarkerXY, getXY } from "../../utils/detect.jsx";

const Video = ({ modelRef, canvasRef, webcamRef, sidebarRef, recordingRef, setText }) => {
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
  const displayRef = useRef(null);
  const cornersRef = useRef(null);
  const windowWidth = useWindowWidth();
  const dispatch = useDispatch();
  const corners = useSelector(state => state.corners.value);

  const setupWebcam = async () => {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    webcamRef.current.srcObject = stream;
  };

  const updateWidthHeight = () => {
    let height = ((windowWidth - sidebarRef.current.offsetWidth - Constants.MARKER_DIAMETER) 
    / aspectRatio) + Constants.MARKER_DIAMETER;
    if (height > window.innerHeight) {
      height = window.innerHeight;
    }
    const width = ((height - Constants.MARKER_DIAMETER) * aspectRatio) + Constants.MARKER_DIAMETER;
    const oldHeight = canvasRef.current.height;
    const oldWidth = canvasRef.current.width;

    displayRef.current.style.width = `${width}px`;
    displayRef.current.style.height = `${height}px`;
    displayRef.current.width = width;
    displayRef.current.height = height;

    canvasRef.current.width = webcamRef.current.offsetWidth;
    canvasRef.current.height = webcamRef.current.offsetHeight;

    ["h1", "a1", "a8", "h8"].forEach(key => {
      const xy = getXY(corners[key], oldHeight, oldWidth);
      const markerXY = getMarkerXY(xy, canvasRef.current.height, canvasRef.current.width);
      const payload = {"xy": markerXY, "key": key}
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
  }, [windowWidth]);

  useEffect(() => {
    cornersRef.current = corners
  }, [corners])

  const canvasStyle = {
    position: "absolute",
    left: Constants.MARKER_RADIUS,
    top: Constants.MARKER_RADIUS
  }

  const videoContainerStyle = {
    width: "100%",
    height: "100%",
    padding: Constants.MARKER_RADIUS
  }

  const videoStyle = {
    width: "100%",
    height: "100%"
  }

  const parentStyle = {
    position: "relative",
    backgroundColor: "#343a40"
  }

  const onLoadedMetadata = (e) => {  
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
        .catch(e => console.log(e));
      }
    }, 2000);
  };

  return (
    <div className="d-flex align-items-center justify-content-center">
      <div ref={displayRef} style={parentStyle} >
        <div style={videoContainerStyle} >
          <video ref={webcamRef} autoPlay={true} playsInline={true} muted={true}
          onLoadedMetadata={onLoadedMetadata} style={videoStyle} />
          <canvas ref={canvasRef} style={canvasStyle} />
        </div>
        <Corners />
      </div>
    </div>
  );
};

export default Video;

