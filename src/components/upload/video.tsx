import { findPieces } from "../../utils/findPieces";
import { useEffect, useRef } from "react";
import { CORNER_KEYS, MARKER_DIAMETER, MARKER_RADIUS } from "../../utils/constants";
import { Corners } from "../common";
import { useWindowSize } from '@react-hook/window-size';
import { useDispatch, useSelector } from 'react-redux';
import { cornersSet } from "../../slices/cornersSlice";
import { getMarkerXY, getXY } from "../../utils/detect";
import { Chessboard } from 'kokopu-react';
import { CornersPayload, RootState } from '../../types';

const Video = ({ modelRef, videoRef, canvasRef, sidebarRef, playingRef, playing, setPlaying, setText, digital }: {
  modelRef: any, videoRef: any, canvasRef: any, sidebarRef: any, playingRef: any,
  playing: boolean, setPlaying: React.Dispatch<React.SetStateAction<boolean>>,
  setText: React.Dispatch<React.SetStateAction<string[]>>, digital: boolean
}) => {
  const displayRef: any = useRef(null);
  const cornersRef: any = useRef(null);
  const [windowWidth, windowHeight] = useWindowSize();
  const dispatch = useDispatch();
  const corners = useSelector((state: RootState) => state.corners["value"]);
  const fen = useSelector((state: RootState) => state.fen["value"]);

  const updateWidthHeight = () => {
    if ((videoRef.current.offsetHeight == 0) || (videoRef.current.offsetWidth) == 0) {
      return;
    }
    const aspectRatio: number = (videoRef.current.videoWidth / videoRef.current.videoHeight);
    let height: number = ((windowWidth - sidebarRef.current.offsetWidth - MARKER_DIAMETER) 
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

    canvasRef.current.width = videoRef.current.offsetWidth;
    canvasRef.current.height = videoRef.current.offsetHeight;

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

  const onCanPlay = () => {
    updateWidthHeight();
  };

  const onEnded = () => {
    videoRef.current.currentTime = videoRef.current.duration;
    videoRef.current.pause;
    setPlaying(false);
  }

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

  const digitalStyle: React.CSSProperties = {
    display: digital ? "inline-block" : "none"
  }

  return (
    <div className="d-flex align-items-center justify-content-center">
      <div ref={displayRef} style={liveStyle} >
        <div style={videoContainerStyle} >
          <video ref={videoRef} playsInline={true} muted={true} style={videoStyle}
           onCanPlay={onCanPlay} onEnded={onEnded} />
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
