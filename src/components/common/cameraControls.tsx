import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, Pause, Play } from "lucide-react";
import Icon from "./icon";
import ResetButton from "./resetButton";
import { trackerReset } from "../../slices/gameSlice";
import { useStore } from "../../store";
import { formatTime } from "../../utils/formatTime";
import { useOverlayControls } from "../../utils/useOverlayControls";
import type { SetBoolean, SetStringArray, VideoRef } from "../../types";

export type CameraMode = "record" | "broadcast" | "play";

const hasMoves = (): boolean => useStore.getState().game.moves !== "";

// What each camera mode's controls say. Play mode's game comes from Lichess, so it has nothing to reset or time.
const MODES: Record<CameraMode, { start: string, badge: string | null, reset: boolean }> = {
  record: { start: "Record", badge: "REC", reset: true },
  broadcast: { start: "Record", badge: "REC", reset: true },
  play: { start: "Start detecting", badge: null, reset: false },
};

// YouTube-style controls over the camera: start and pause in one button, a reset (record and broadcast), and how
// long detection has been running for (record and broadcast). Like the moves' times in record mode, the time starts
// again when detection starts on a game without moves.
const CameraControls = ({ mode, videoRef, playing, setPlaying, setText, onVisible }: {
  mode: CameraMode,
  videoRef: VideoRef,
  playing: boolean,
  setPlaying: SetBoolean,
  setText: SetStringArray,
  onVisible: (visible: boolean) => void
}) => {
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

  const togglePlay = useCallback(() => setPlaying(!playing), [playing, setPlaying]);
  const { barRef, visible, poke, toggle } = useOverlayControls({ videoRef, playing, togglePlay, onVisible });

  const reset = () => {
    setPlaying(false);
    trackerReset();
    showElapsed(0);
    setText(["Reset to start position"]);
  };

  const label = playing ? "Pause (k)" : `${start} (k)`;
  const startIcon = (mode === "play") ? <Icon icon={Play} filled={true} />
    : <Icon icon={Circle} filled={true} className="text-2xl text-[#f00]" />;

  return (
    <div ref={barRef} className={`video-controls video-controls--live${visible ? "" : " video-controls--hidden"}`}>
      <div className="video-controls__row">
        <button type="button" className="video-controls__button" onClick={toggle} aria-label={label} title={label}>
          {playing ? <Icon icon={Pause} filled={true} /> : startIcon}
        </button>
        {canReset && <ResetButton label="Reset to the start position" onReset={reset} onPress={poke} />}
        {badge !== null && (
          <span className="video-controls__time">
            {playing && <span className="video-controls__rec" aria-hidden="true" />}
            {playing ? `${badge} ` : ""}{formatTime(elapsed / 1000)}
          </span>
        )}
        {(badge === null) && playing && <span className="video-controls__time">Detecting moves</span>}
      </div>
    </div>
  );
};

export default CameraControls;
