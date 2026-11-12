import i18n from "../../i18n";
import { findPieces } from "../../vision/findPieces";
import { useEffect, useRef, useState } from "react";
import { getMoveText, type Recorder } from "@chesscam/recorder";
import { MEDIA_ASPECT_RATIO } from "../../utils/constants";
import type {
  CornerName, Game, Mode, ModelRefs, Roi, SetRoi,
  SetBoolean, SetStringArray, VideoRef
} from "../../types";
import { makeBoard, useGame } from "../../slices/gameSlice";
import RoiSelector from "./roiSelector";
import OrientationMarkers, { MARKER_DIAMETER } from "./orientationMarkers";
import FpsDisplay from "./fpsDisplay";
import EvalGauge from "./evalGauge";
import VideoControls from "../upload/videoControls";
import CameraControls from "./cameraControls";
import type { StartBlock } from "./cameraControls";

// The controls' height over the video, in px, as in .video-controls: uploads have a seek bar above the buttons
const CONTROLS_HEIGHT = { upload: 52, camera: 40 };

const Video = ({ modelRef, videoRef, playing,
  setPlaying, setText, mode, roi, setRoi, selecting, setSelecting,
  canPlay, setCanPlay, engineEnabled = false, startBlock = null }: {
    modelRef: ModelRefs["modelRef"],
    videoRef: VideoRef,
    playing: boolean,
    setPlaying: SetBoolean,
    setText: SetStringArray, mode: Mode,
    roi: Roi | null, setRoi: SetRoi,
    selecting: boolean, setSelecting: SetBoolean,
    canPlay: boolean, setCanPlay: SetBoolean,
    // What the camera modes need chosen before detection can start
    startBlock?: StartBlock | null,
    // Shows Stockfish's eval bar on the video's right
    engineEnabled?: boolean
  }) => {
  const game: Game = useGame();

  const [recorder, setRecorder] = useState<Recorder | null>(null);
  const moveTextRef = useRef<string>("");
  const [orientation, setOrientation] = useState<CornerName[] | null>(null);
  // Cameras return whichever native mode is closest to the request, so the real shape is only known once frames arrive
  const [aspectRatio, setAspectRatio] = useState<number>(MEDIA_ASPECT_RATIO);
  // Kept here rather than in VideoAndSidebar, so its updates re-render only the video and not the sidebar
  const [fps, setFps] = useState<number | null>(null);
  // Whether the upload controls show over the bottom of the video, which the corner markers then move clear of
  const [controlsVisible, setControlsVisible] = useState<boolean>(false);
  const showControls: boolean = canPlay && !selecting;

  useEffect(() => {
    moveTextRef.current = getMoveText(makeBoard(game));
  }, [game])

  // The ModelLoader route holds this page back until the model has loaded, and the video element is always rendered
  useEffect(() => {
    const model = modelRef.current;
    const video = videoRef.current;
    if (model === null || video === null) {
      return;
    }
    const found = findPieces({ model, video, setText, setFps, setOrientation, moveTextRef, mode });
    setRecorder(found.recorder);
    return () => {
      setRecorder(null);
      found.stop();
    };
  }, [mode, modelRef, setText, videoRef]);

  // A new recorder (e.g. after the mode changes) gets the current values too
  useEffect(() => {
    if (playing) {
      recorder?.start();
    } else {
      recorder?.pause();
    }
  }, [playing, recorder]);

  useEffect(() => {
    recorder?.setRoi(roi);
  }, [recorder, roi]);

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
      setText([i18n.t("video.playFailed"), i18n.t("video.formatHint")]);
    });
  }, [canPlay, mode, playing, setPlaying, setText, videoRef])

  const liveStyle: React.CSSProperties = {
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
      setText([i18n.t("video.loadFailed"), i18n.t("video.formatHint")]);
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
    <div className={`video-stage flex items-center justify-center${engineEnabled ? " video-stage--gauge" : ""}`}>
      <div className="video-live" style={liveStyle}>
        <div className="video-live__container">
          <div className="video-live__wrapper">
            {/* No picture-in-picture: Chrome would add a button for it, and float the video out when the tab is left */}
            <video ref={videoRef} autoPlay={mode !== "upload"} playsInline={true} muted={true} disablePictureInPicture={true}
              className="video-live__video" onResize={onResize}
              onCanPlay={onCanPlay} onLoadStart={onLoadStart} onError={onError} onEnded={onEnded} />
            <RoiSelector videoRef={videoRef} roi={roi} setRoi={setRoi}
              selecting={selecting} setSelecting={setSelecting} />
            {!selecting && <OrientationMarkers videoRef={videoRef} roi={roi} orientation={orientation}
              bottomInset={(showControls && controlsVisible) ? CONTROLS_HEIGHT[mode === "upload" ? "upload" : "camera"] : 0} />}
            {/* Without a region, the markers sit in the video's corners */}
            <FpsDisplay fps={fps}
              offset={(!selecting && orientation !== null && roi === null) ? MARKER_DIAMETER : 0} />
            {showControls && (mode === "upload") && <VideoControls videoRef={videoRef} playing={playing}
              setPlaying={setPlaying} setText={setText} onVisible={setControlsVisible} />}
            {showControls && (mode !== "upload") && <CameraControls mode={mode} videoRef={videoRef} playing={playing}
              setPlaying={setPlaying} setText={setText} onVisible={setControlsVisible} blocked={startBlock} />}
          </div>
        </div>
        {engineEnabled && <EvalGauge />}
      </div>
    </div>
  );
};

export default Video;
