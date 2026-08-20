import { findPieces } from "../../utils/findPieces";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { CORNER_KEYS, MARKER_DIAMETER, MARKER_RADIUS, MEDIA_ASPECT_RATIO, MEDIA_CONSTRAINTS } from "../../utils/constants";
import { Corners } from ".";
import { useWindowWidth, useWindowHeight } from '@react-hook/window-size';
import { useDispatch } from 'react-redux';
import { cornersSet } from "../../slices/cornersSlice";
import { getMarkerXY, getXY } from "../../utils/detect";
import type {
  CanvasRef, CornersPayload, CornersRef, Game, Mode, ModelRefs, MovesPair,
  SetBoolean, SetStringArray, SidebarRef, VideoRef
} from "../../types";
import { makeBoard, useGame } from "../../slices/gameSlice";
import type { CameraChessBoard } from "../../slices/gameSlice";
import { getMovesPairs } from "../../utils/moves";

const getMoveText = (board: CameraChessBoard): string => {
  const history = board.history;

  if (history.length === 0) {
    return "";
  }

  if (history.length === 1) {
    return `1. ${history[history.length - 1].san}`
  }

  const firstMove: string = history[history.length - 2].san;
  const secondMove: string = history[history.length - 1].san;
  const nHalfMoves: number = Math.floor(history.length / 2);
  if (history.length % 2 === 0) {
    return `${nHalfMoves}.${firstMove} ${secondMove}`
  }

  return `${nHalfMoves}...${firstMove} ${nHalfMoves + 1}.${secondMove}`
}

const Video = ({ piecesModelRef, canvasRef, videoRef, sidebarRef, playing,
  setPlaying, playingRef, setText, mode, cornersRef }: {
    piecesModelRef: ModelRefs["piecesModelRef"],
    canvasRef: CanvasRef,
    videoRef: VideoRef,
    sidebarRef: SidebarRef,
    playing: boolean,
    setPlaying: SetBoolean,
    playingRef: React.RefObject<boolean>,
    setText: SetStringArray, mode: Mode,
    cornersRef: CornersRef
  }) => {
  const game: Game = useGame();

  const displayRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<CameraChessBoard>(makeBoard(game));
  const movesPairsRef = useRef<MovesPair[]>(getMovesPairs(boardRef.current));
  const lastMoveRef = useRef<string>(game.lastMove);
  const moveTextRef = useRef<string>("");
  const [canPlay, setCanPlay] = useState(false);

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

  const updateWidthHeight = useEffectEvent(() => {
    const sidebar = sidebarRef.current;
    const canvas = canvasRef.current;
    const display = displayRef.current;
    const video = videoRef.current;
    if (sidebar === null || canvas === null || display === null || video === null) {
      return;
    }

    let height = ((windowWidth - sidebar.offsetWidth - MARKER_DIAMETER)
      / MEDIA_ASPECT_RATIO) + MARKER_DIAMETER;
    if (height > windowHeight) {
      height = windowHeight;
    }

    if ((canvas.offsetHeight === 0) || (canvas.offsetWidth) === 0) {
      return;
    }
    const width: number = ((height - MARKER_DIAMETER) * MEDIA_ASPECT_RATIO) + MARKER_DIAMETER;
    const oldHeight: number = canvas.height;
    const oldWidth: number = canvas.width;

    display.style.width = `${width}px`;
    display.style.height = `${height}px`;

    canvas.width = video.offsetWidth;
    canvas.height = video.offsetHeight;

    CORNER_KEYS.forEach((key) => {
      const xy = getXY(cornersRef.current[key], oldHeight, oldWidth);
      const payload: CornersPayload = {
        "xy": getMarkerXY(xy, canvas.height, canvas.width),
        "key": key
      }
      dispatch(cornersSet(payload))
    })
  });

  useEffect(() => {
    updateWidthHeight();

    let streamPromise: Promise<MediaStream> | null = null;
    if (mode !== "upload") {
      streamPromise = navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS)
        .then((stream) => {
          if (videoRef.current !== null) {
            videoRef.current.srcObject = stream;
          }
          return stream;
        });
    }

    const stopDetection = findPieces(piecesModelRef, videoRef, canvasRef, playingRef, setText, dispatch,
      cornersRef, boardRef, movesPairsRef, lastMoveRef, moveTextRef, mode);

    const stopWebcam = async () => {
      const stream = await streamPromise;
      if (stream !== null) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    }

    return () => {
      stopDetection();
      void stopWebcam();
    }
  }, [canvasRef, cornersRef, dispatch, mode, piecesModelRef, playingRef, setText, videoRef]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: window size changes intentionally trigger this effect event.
  useEffect(() => {
    updateWidthHeight();
  }, [windowWidth, windowHeight]);

  useEffect(() => {
    if (canPlay) {
      updateWidthHeight();
    }
  }, [canPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if ((mode !== "upload") || !canPlay || video === null || (video.getAttribute("src") === null)) {
      return;
    }

    if (!playing) {
      video.pause();
      return;
    }

    void video.play().catch(() => {
      setPlaying(false);
      setText(["Unable to play this video", "Use a browser-supported H.264/AAC MP4 or WebM file"]);
    });
  }, [canPlay, mode, playing, setPlaying, setText, videoRef])

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
    window.setTimeout(() => {
      if (!(videoRef.current)) {
        return;
      }

      const source = videoRef.current.srcObject;
      if (!(source instanceof MediaStream)) {
        return;
      }
      const tracks = source.getVideoTracks();
      if (tracks.length === 0) {
        return;
      }

      try {
        const capabilities = tracks[0].getCapabilities() as MediaTrackCapabilities & {
          zoom?: { min: number };
        };
        console.log("Capabilties", capabilities);

        if (capabilities.zoom) {
          const constraints: MediaTrackConstraints & { zoom: number } = {
            zoom: capabilities.zoom.min,
          };
          void tracks[0].applyConstraints(constraints).catch((error: unknown) => {
            console.warn("Cannot update camera zoom", error);
          });
        }
      } catch (_) {
        console.log("Cannot update track capabilities")
      }

      try {
        const settings = tracks[0].getSettings();
        console.log("Settings", settings);
      } catch (_) {
        console.log("Cannot log track settings")
      }
    }, 2000);
  };

  const onCanPlay = () => {
    setCanPlay(true);
  }

  const onLoadStart = () => {
    setCanPlay(false);
  }

  const onError = () => {
    if (mode === "upload") {
      setPlaying(false);
      setText(["Unable to load this video", "Use a browser-supported H.264/AAC MP4 or WebM file"]);
    }
  }

  const onEnded = () => {
    if (mode === "upload") {
      const video = videoRef.current;
      if (video !== null) {
        video.currentTime = video.duration;
        video.pause();
      }
    }
    setPlaying(false);
  }

  return (
    <div className="d-flex align-top justify-content-center">
      <div ref={displayRef} style={liveStyle} >
        <div style={videoContainerStyle} >
          <video ref={videoRef} autoPlay={mode !== "upload"} playsInline={true} muted={true}
            onLoadedMetadata={onLoadedMetadata} style={videoStyle}
            onCanPlay={onCanPlay} onLoadStart={onLoadStart} onError={onError} onEnded={onEnded} />
          <canvas ref={canvasRef} style={canvasStyle} />
        </div>
        <Corners />
      </div>
    </div>
  );
};

export default Video;
