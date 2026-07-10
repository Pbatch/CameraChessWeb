import { findPieces } from "../../utils/findPieces";
import { useEffect, useRef } from "react";
import { CORNER_KEYS, MARKER_DIAMETER, MARKER_RADIUS, MEDIA_ASPECT_RATIO, MEDIA_CONSTRAINTS } from "../../utils/constants";
import { Corners } from ".";
import { useWindowWidth, useWindowHeight } from '@react-hook/window-size';
import { useDispatch } from 'react-redux';
import { cornersSet } from "../../slices/cornersSlice";
import { getMarkerXY, getXY } from "../../utils/detect";
import { CornersPayload, Game, Mode, MovesPair, SetBoolean, SetStringArray } from "../../types";
import { gameSelect, makeBoard } from "../../slices/gameSlice";
import { getMovesPairs } from "../../utils/moves";

type ZoomCapabilities = MediaTrackCapabilities & {
  zoom?: {
    min: number;
  };
};

type ZoomConstraints = MediaTrackConstraints & {
  zoom?: number;
};

const Video = ({ piecesModelRef, canvasRef, videoRef, sidebarRef, playing,
  setPlaying, playingRef, setText, mode, cornersRef }: {
    piecesModelRef: any, canvasRef: any, videoRef: any, sidebarRef: any,
    playing: boolean, setPlaying: SetBoolean, playingRef: any,
    setText: SetStringArray, mode: Mode,
    cornersRef: any
  }) => {
  const game: Game = gameSelect();

  const displayRef = useRef<any>(null);
  const boardRef = useRef<any>(makeBoard(game));
  const movesPairsRef = useRef<MovesPair[]>(getMovesPairs(boardRef.current));
  const lastMoveRef = useRef<string>(game.lastMove);
  const moveTextRef = useRef<string>("");

  const windowWidth = useWindowWidth();
  const windowHeight = useWindowHeight();
  const dispatch = useDispatch();

  useEffect(() => {
    const board = makeBoard(game);
    moveTextRef.current = getMoveText(board);
    if (game.greedy === true) {
      board.undo();
    } else {
      movesPairsRef.current = getMovesPairs(board);
    }
    boardRef.current = board;
    lastMoveRef.current = game.lastMove;
  }, [game])

  const getMoveText = (board: any): string => {
    const history: any[] = board.history || [];

    if (history.length == 0) {
      return "";
    }

    if (history.length == 1) {
      return `1. ${history[history.length - 1].san}`
    }

    const firstMove: string = history[history.length - 2].san;
    const secondMove: string = history[history.length - 1].san;
    const nHalfMoves: number = Math.floor(history.length / 2);
    if (history.length % 2 == 0) {
      return `${nHalfMoves}.${firstMove} ${secondMove}`
    }

    return `${nHalfMoves}...${firstMove} ${nHalfMoves + 1}.${secondMove}`
  }

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

    let streamPromise: Promise<MediaStream | null> = Promise.resolve(null);
    if (mode !== "upload") {
      streamPromise = awaitSetupWebcam();
    }

    findPieces(piecesModelRef, videoRef, canvasRef, playingRef, setText, dispatch,
      cornersRef, boardRef, movesPairsRef, lastMoveRef, moveTextRef, mode);

    return () => {
      streamPromise.then((stream) => {
        if (stream !== null) {
          stream.getTracks().forEach(track => track.stop());
        }
      });
    };
  }, []);

  useEffect(() => {
    updateWidthHeight();
  }, [windowWidth, windowHeight]);

  useEffect(() => {
    if ((mode !== "upload") || (videoRef.current.src === "")) {
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
    width: "auto",
    height: "100%"
  }

  const liveStyle: React.CSSProperties = {
    position: "relative",
    backgroundColor: "#343a40",
  }

  const onLoadedMetadata = () => {
    if (mode === "upload") {
      return;
    }

    const applySettings = () => {
      if (!(videoRef.current) || !(videoRef.current.srcObject)) {
        return;
      }

      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getVideoTracks();
      if (tracks.length === 0) {
        return;
      }

      try {
        const track = tracks[0];
        if (typeof track.getCapabilities === 'function') {
          const capabilities = track.getCapabilities() as ZoomCapabilities;
          if (capabilities.zoom) {
            const constraints: ZoomConstraints = {
              zoom: capabilities.zoom.min,
            };
            track.applyConstraints(constraints).catch(e => console.debug("Apply constraints failed", e));
          }
        }
      } catch (e) {
        console.debug("Capabilities check failed", e);
      }
    };

    applySettings();
    window.setTimeout(applySettings, 500);
  };

  const onCanPlay = () => {
    updateWidthHeight();
  }

  const onEnded = () => {
    if (mode === "upload") {
      videoRef.current.currentTime = videoRef.current.duration;
      videoRef.current.pause();
    }
    setPlaying(false);
  }

  return (
    <div className="d-flex align-top justify-content-center">
      <div ref={displayRef} style={liveStyle} >
        <div style={videoContainerStyle} >
          <video ref={videoRef} autoPlay={mode !== "upload"} playsInline={true} muted={true}
            onLoadedMetadata={onLoadedMetadata} style={videoStyle}
            onCanPlay={onCanPlay} onEnded={onEnded} />
          <canvas ref={canvasRef} style={canvasStyle} />
        </div>
        <Corners />
      </div>
    </div>
  );
};

export default Video;

