import { findPieces } from "../../vision/findPieces";
import { useEffect, useRef, useState } from "react";
import { MEDIA_ASPECT_RATIO, MEDIA_CONSTRAINTS } from "../../utils/constants";
import { useDispatch } from 'react-redux';
import type {
  CornerName, Game, Mode, ModelRefs, MovesPair, Roi, RoiRef, SetRoi,
  SetBoolean, SetFps, SetStringArray, VideoRef
} from "../../types";
import { makeBoard, useGame } from "../../slices/gameSlice";
import type { CameraChessBoard } from "../../slices/gameSlice";
import { getMovesPairs, getMoveText } from "../../chess/moves";
import RoiSelector from "./roiSelector";
import OrientationMarkers, { MARKER_DIAMETER } from "./orientationMarkers";
import FpsDisplay from "./fpsDisplay";

const Video = ({ chessqueriesModelRef, videoRef, playing,
  setPlaying, playingRef, setText, setFps, mode, roi, setRoi, roiRef, selecting, setSelecting,
  canPlay, setCanPlay, fps }: {
    chessqueriesModelRef: ModelRefs["chessqueriesModelRef"],
    videoRef: VideoRef,
    playing: boolean,
    setPlaying: SetBoolean,
    playingRef: React.RefObject<boolean>,
    setText: SetStringArray, setFps: SetFps, mode: Mode,
    roi: Roi | null, setRoi: SetRoi, roiRef: RoiRef,
    selecting: boolean, setSelecting: SetBoolean,
    canPlay: boolean, setCanPlay: SetBoolean,
    fps: number | null
  }) => {
  const game: Game = useGame();

  const boardRef = useRef<CameraChessBoard>(makeBoard(game));
  const movesPairsRef = useRef<MovesPair[]>(getMovesPairs(boardRef.current));
  const lastMoveRef = useRef<string>(game.lastMove);
  const moveTextRef = useRef<string>("");
  const [orientation, setOrientation] = useState<CornerName[] | null>(null);

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

  useEffect(() => {
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

    const stopDetection = findPieces({ chessqueriesModelRef, videoRef, roiRef, playingRef, setText, setFps, setOrientation,
      dispatch, boardRef, movesPairsRef, lastMoveRef, moveTextRef, mode });

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
  }, [dispatch, mode, chessqueriesModelRef, playingRef, roiRef, setFps, setText, videoRef]);

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

  const videoContainerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%"
  }

  const videoWrapperStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
    height: "100%"
  }

  const videoStyle: React.CSSProperties = {
    width: "auto",
    height: "100%"
  }

  // Fills the space beside (or above) the sidebar, which the display is sized against
  const stageStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    containerType: "size"
  }

  const liveStyle: React.CSSProperties = {
    position: "relative",
    backgroundColor: "#343a40",
    // As large as fits in the stage at the camera's aspect ratio
    width: `min(100cqw, 100cqh * ${MEDIA_ASPECT_RATIO})`,
    aspectRatio: `${MEDIA_ASPECT_RATIO}`
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
    // A new source may have a different resolution
    setRoi(null);
    setOrientation(null);
    setSelecting(false);
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
    <div className="d-flex align-items-start justify-content-center" style={stageStyle}>
      <div style={liveStyle} >
        <div style={videoContainerStyle} >
          <div style={videoWrapperStyle}>
            <video ref={videoRef} autoPlay={mode !== "upload"} playsInline={true} muted={true}
              onLoadedMetadata={onLoadedMetadata} style={videoStyle}
              onCanPlay={onCanPlay} onLoadStart={onLoadStart} onError={onError} onEnded={onEnded} />
            <RoiSelector videoRef={videoRef} roi={roi} setRoi={setRoi}
              selecting={selecting} setSelecting={setSelecting} />
            {!selecting && <OrientationMarkers videoRef={videoRef} roi={roi} orientation={orientation} />}
            {/* Without a region, the markers sit in the video's corners */}
            <FpsDisplay fps={fps}
              offset={(!selecting && orientation !== null && roi === null) ? MARKER_DIAMETER : 0} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Video;
