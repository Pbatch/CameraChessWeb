import { findPieces } from "../../utils/findPieces";
import { useEffect, useRef } from "react";
import { MARKER_DIAMETER, MARKER_RADIUS } from "../../utils/constants";
import { Corners } from "../common";
import { useWindowSize } from '@react-hook/window-size';
import { useDispatch, useSelector } from 'react-redux';
import { cornersSet } from "../../slices/cornersSlice";
import { getMarkerXY, getXY } from "../../utils/detect";

const Video = ({ modelRef, videoRef, canvasRef, sidebarRef, playingRef, playing, setPlaying, setText }) => {
  const displayRef = useRef(null);
  const cornersRef = useRef(null);
  const [windowWidth, windowHeight] = useWindowSize();
  const dispatch = useDispatch();
  const corners = useSelector(state => state.corners.value);

  const updateWidthHeight = () => {
    const aspectRatio = (videoRef.current.videoWidth / videoRef.current.videoHeight);
    let height = ((windowWidth - sidebarRef.current.offsetWidth - MARKER_DIAMETER) 
    / aspectRatio) + MARKER_DIAMETER;
    if (height > windowHeight) {
      height = windowHeight;
    }
    const width = ((height - MARKER_DIAMETER) * aspectRatio) + MARKER_DIAMETER;
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
    updateWidthHeight();
  };

  const onEnded = (e) => {
    videoRef.current.currentTime = videoRef.current.duration;
    videoRef.current.pause;
    setPlaying(false);
  }

  const canvasStyle = {
    position: "absolute",
    left: MARKER_RADIUS,
    top: MARKER_RADIUS
  }

  const videoContainerStyle = {
    width: "100%",
    height: "100%",
    padding: MARKER_RADIUS
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
           onCanPlay={onCanPlay} onEnded={onEnded} />
          <canvas ref={canvasRef} style={canvasStyle} />
        </div>
        <Corners />
      </div>
    </div>
  );
};

export default Video;
