import { findPieces } from "../../utils/findPieces";
import { useEffect, useRef, useState } from "react";
import { CORNER_KEYS, MARKER_DIAMETER, MARKER_RADIUS, MEDIA_ASPECT_RATIO, MEDIA_CONSTRAINTS } from "../../utils/constants";
import { Corners } from ".";
import { useWindowWidth, useWindowHeight } from '@react-hook/window-size';
import { useDispatch } from 'react-redux';
import { cornersSet } from "../../slices/cornersSlice";
import { getMarkerXY, getXY } from "../../utils/detect";
import { Chessboard } from "react-chessboard";
import { CornersPayload, Game, SetBoolean, SetStringArray } from "../../types";
import { gameSelect } from "../../slices/gameSlice";

const Video = ({ piecesModelRef, canvasRef, videoRef, sidebarRef, playing, 
  setPlaying, playingRef, setText, digital, webcam, cornersRef }: {
  piecesModelRef: any, canvasRef: any, videoRef: any, sidebarRef: any, 
  playing: boolean, setPlaying: SetBoolean, playingRef: any,
  setText: SetStringArray, digital: boolean, webcam: boolean,
  cornersRef: any
}) => {
  const game: Game = gameSelect();

  const [boardWidth, setBoardWidth]: any = useState(100);

  const displayRef: any = useRef(null);
  const gameRef = useRef<Game>(game);

  const windowWidth = useWindowWidth();
  const windowHeight = useWindowHeight();
  const dispatch = useDispatch();

  useEffect(() => {
    gameRef.current = game;
  }, [game])

  const setupWebcam = async () => {
    const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
    if (videoRef.current !== null) {
      videoRef.current.srcObject = stream;
    }
    return stream;
  };

  const awaitSetupWebcam = async () => {
    return setupWebcam();
  }

  const updateWidthHeight = () => {
    let height = ((windowWidth - sidebarRef.current.offsetWidth - MARKER_DIAMETER) 
    / MEDIA_ASPECT_RATIO) + MARKER_DIAMETER;
    if (height > windowHeight) {
      height = windowHeight;
    }

    if (digital) {
      setBoardWidth(height);
      return;
    }

    if ((canvasRef.current.offsetHeight == 0) || (canvasRef.current.offsetWidth) == 0) {
      return;
    }
    const width: number = ((height - MARKER_DIAMETER) * MEDIA_ASPECT_RATIO) + MARKER_DIAMETER;
    const oldHeight: number = canvasRef.current.height;
    const oldWidth: number = canvasRef.current.width;

    displayRef.current.style.width = `${width}px`;
    displayRef.current.style.height = `${height}px`;
    displayRef.current.width = width;
    displayRef.current.height = height;

    canvasRef.current.width = videoRef.current.offsetWidth;
    canvasRef.current.height = videoRef.current.offsetHeight;
    
    CORNER_KEYS.forEach((key) => {
      const xy = getXY(cornersRef.current[key], oldHeight, oldWidth);
      const payload: CornersPayload = {
        "xy": getMarkerXY(xy, canvasRef.current.height, canvasRef.current.width),
        "key": key
      }
      dispatch(cornersSet(payload)) 
    })
  }

  useEffect(() => {
    updateWidthHeight();

    let streamPromise: any = null;
    if (webcam) {
      streamPromise = awaitSetupWebcam()
    }

    findPieces(piecesModelRef, videoRef, canvasRef, playingRef, setText, dispatch, cornersRef, gameRef);

    const stopWebcam = async () => {
      const stream = await streamPromise;
      if (stream !== null) {
        stream.getTracks().forEach((track: any) => track.stop());
      }
    }

    return () => {
      stopWebcam();
    }
  }, []);

  useEffect(() => {
    updateWidthHeight();
  }, [windowWidth, windowHeight, digital]);

  useEffect(() => {
    if ((webcam) || (videoRef.current.src === "")) {
      return;
    }
    
    if (playingRef.current === true) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [playing])

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
    if (!(webcam)) {
      return;
    }
    window.setTimeout(() => {
      if (!(videoRef.current)) {
        return;
      }
      
      const tracks = videoRef.current.srcObject.getVideoTracks();
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

  const onCanPlay = () => {
    updateWidthHeight();
  }

  const onEnded = () => {
    if (!(webcam)) {
      videoRef.current.currentTime = videoRef.current.duration;
      videoRef.current.pause;
    }
    setPlaying(false);
  }

  return (
    <div className="d-flex align-top justify-content-center">
      <div ref={displayRef} style={liveStyle} >
        <div style={videoContainerStyle} >
          <video ref={videoRef} autoPlay={webcam} playsInline={true} muted={true}
          onLoadedMetadata={onLoadedMetadata} style={videoStyle} 
          onCanPlay={onCanPlay} onEnded={onEnded} />
          <canvas ref={canvasRef} style={canvasStyle} />
        </div>
        <Corners />
      </div>
      <div style={digitalStyle}>
        <Chessboard position={game.fen} boardWidth={boardWidth} />
      </div>
    </div>
  );
};

export default Video;

