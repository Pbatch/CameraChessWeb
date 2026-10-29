import { findPieces } from "../../vision/findPieces";
import { useEffect, useRef, useState } from "react";
import { MEDIA_ASPECT_RATIO } from "../../utils/constants";
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
  // Cameras return whichever native mode is closest to the request, so the real shape is only known once frames arrive
  const [aspectRatio, setAspectRatio] = useState<number>(MEDIA_ASPECT_RATIO);

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
    return findPieces({ chessqueriesModelRef, videoRef, roiRef, playingRef, setText, setFps, setOrientation,
      dispatch, boardRef, movesPairsRef, lastMoveRef, moveTextRef, mode });
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
    // As large as fits in the stage at the video's aspect ratio
    width: `min(100cqw, 100cqh * ${aspectRatio})`,
    aspectRatio: `${aspectRatio}`
  }

  // Fires when the first frame arrives and whenever the size changes, e.g. when a phone rotates
  const onResize = () => {
    const video = videoRef.current;
    if (video === null || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }
    setAspectRatio(video.videoWidth / video.videoHeight);
    // A region drawn at the old size no longer lines up
    setRoi(null);
    setOrientation(null);
    setSelecting(false);
  }

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
              style={videoStyle} onResize={onResize}
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
