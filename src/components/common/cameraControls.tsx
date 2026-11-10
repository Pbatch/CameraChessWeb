import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, Pause, Play } from "lucide-react";
import Icon from "./icon";
import ResetButton from "./resetButton";
import { trackerReset } from "../../slices/gameSlice";
import { useStore } from "../../store";
import { formatTime } from "../../utils/formatTime";
import { useOverlayControls } from "../../utils/useOverlayControls";
import type { SetBoolean, SetStringArray, VideoRef } from "../../types";

type CameraMode = "record" | "broadcast" | "play";

// Why detection can't start yet: play mode needs a game to send the moves to, and broadcast a study and a board
export type StartBlock = "camera.selectGameFirst" | "camera.selectStudyBoardFirst";

const hasMoves = (): boolean => useStore.getState().game.moves !== "";

// What each camera mode's controls say. Play mode's game comes from Lichess, so it has nothing to reset or time.
const MODES = {
  record: { start: "camera.record", badge: "camera.rec", reset: true },
  broadcast: { start: "camera.record", badge: "camera.rec", reset: true },
  play: { start: "camera.startDetecting", badge: null, reset: false },
} as const satisfies Record<CameraMode, { start: string, badge: string | null, reset: boolean }>;

// YouTube-style controls over the camera: start and pause in one button, a reset (record and broadcast), and how
// long detection has been running for (record and broadcast). Like the moves' times in record mode, the time starts
// again when detection starts on a game without moves.
const CameraControls = ({ mode, videoRef, playing, setPlaying, setText, onVisible, blocked = null }: {
  mode: CameraMode,
  videoRef: VideoRef,
  playing: boolean,
  setPlaying: SetBoolean,
  setText: SetStringArray,
  onVisible: (visible: boolean) => void,
  // Holds back starting (the button, K and a click on the video), and says why. Pausing is never held back.
  blocked?: StartBlock | null
}) => {
  const { t } = useTranslation();
  const startBlocked: boolean = !playing && (blocked !== null);
  const { start, badge, reset: canReset } = MODES[mode];
  // Time detecting, in ms, which runs only while detecting
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const showElapsed = useCallback((ms: number) => {
    elapsedRef.current = ms;
    setElapsed(ms);
  }, []);

  useEffect(() => {
    if (!playing || badge === null) return;
    const base = hasMoves() ? elapsedRef.current : 0;
    const startTime = performance.now();
    showElapsed(base);
    const id = window.setInterval(() => showElapsed(base + performance.now() - startTime), 250);
    return () => window.clearInterval(id);
  }, [badge, playing, showElapsed]);

  const togglePlay = useCallback(() => {
    if (!playing && blocked !== null) return;
    setPlaying(!playing);
  }, [blocked, playing, setPlaying]);
  const { barRef, visible, poke, toggle } = useOverlayControls({ videoRef, playing, togglePlay, onVisible });

  const reset = () => {
    setPlaying(false);
    trackerReset();
    showElapsed(0);
    setText([t("camera.wasReset")]);
  };

  const label = playing ? t("camera.pause")
    : (blocked !== null) ? t(blocked) : t("camera.startKey", { action: t(start) });
  const startIcon = (mode === "play") ? <Icon icon={Play} filled={true} />
    : <Icon icon={Circle} filled={true} className="text-2xl text-[#f00]" />;

  return (
    <div ref={barRef} className={`video-controls video-controls--live${visible ? "" : " video-controls--hidden"}`}>
      <div className="video-controls__row">
        <button type="button" className="video-controls__button" onClick={toggle} aria-label={label} title={label}
          disabled={startBlocked}>
          {playing ? <Icon icon={Pause} filled={true} /> : startIcon}
        </button>
        {canReset && <ResetButton label={t("camera.reset")} onReset={reset} onPress={poke} />}
        {badge !== null && (
          <span className="video-controls__time">
            {playing && <span className="video-controls__rec" aria-hidden="true" />}
            {playing ? `${t(badge)} ` : ""}{formatTime(elapsed / 1000)}
          </span>
        )}
        {(badge === null) && playing && <span className="video-controls__time">{t("camera.detecting")}</span>}
      </div>
    </div>
  );
};

export default CameraControls;
