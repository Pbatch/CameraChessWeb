import { findPieces } from "../../utils/findPieces.jsx";
import { useEffect, useRef, useState, useCallback } from "react";
import * as Constants from "../../utils/constants.jsx";
import Corners from "../common/corners.jsx";
import { useWindowSize } from '@react-hook/window-size';
import { useDispatch, useSelector } from 'react-redux';
import { cornersSet } from "../../slices/cornersSlice.jsx";
import { getMarkerXY, getXY } from "../../utils/detect.jsx";

const Video = ({ modelRef, videoRef, canvasRef, sidebarRef, playingRef, playing, setText }) => {
  const displayRef = useRef(null);
  const cornersRef = useRef(null);
  const [windowWidth, windowHeight] = useWindowSize();
  const dispatch = useDispatch();
  const corners = useSelector(state => state.corners.value);

  const updateWidthHeight = () => {
    const aspectRatio = (videoRef.current.videoWidth / videoRef.current.videoHeight);
    let height = ((windowWidth - sidebarRef.current.offsetWidth - Constants.MARKER_DIAMETER) 
    / aspectRatio) + Constants.MARKER_DIAMETER;
    if (height > windowHeight) {
      height = windowHeight;
    }
    const width = ((height - Constants.MARKER_DIAMETER) * aspectRatio) + Constants.MARKER_DIAMETER;
    const oldHeight = canvasRef.current.height;
    const oldWidth = canvasRef.current.width;

    displayRef.current.style.width = `${width}px`;
    displayRef.current.style.height = `${height}px`;
    displayRef.current.width = width;
    displayRef.current.height = height;

    canvasRef.current.width = videoRef.current.offsetWidth;
    canvasRef.current.height = videoRef.current.offsetHeight;

    ["h1", "a1", "a8", "h8"].forEach(key => {
      const xy = getXY(corners[key], oldHeight, oldWidth);
      const markerXY = getMarkerXY(xy, canvasRef.current.height, canvasRef.current.width);
      const payload = {"xy": markerXY, "key": key}
      dispatch(cornersSet(payload))
    })
  }

  useEffect(() => {
    findPieces(modelRef, videoRef, canvasRef, playingRef, setText, dispatch, cornersRef);
  }, [])

  useEffect(() => {
    if (videoRef.current.src === "") {
      return;
    }
    updateWidthHeight();
  }, [windowWidth, windowHeight]);

  useEffect(() => {
    cornersRef.current = corners
  }, [corners])

  useEffect(() => {
    if (videoRef.current.src === "") {
      return;
    }

    if (playingRef.current === false) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, [playing])

  const onCanPlay = (e) => {
    videoRef.current.playbackRate = 2.0;
    updateWidthHeight();
  };

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

  return (
    <div className="d-flex align-items-center justify-content-center">
      <div ref={displayRef} style={parentStyle} >
        <div style={videoContainerStyle} >
          <video ref={videoRef} playsInline={true} muted={true} style={videoStyle}
           onCanPlay={onCanPlay} />
          <canvas ref={canvasRef} style={canvasStyle} />
        </div>
        <Corners />
      </div>
    </div>
  );
};

export default Video;
