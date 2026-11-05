import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, Pause } from "lucide-react";
import Icon from "../common/icon";
import ResetButton from "../common/resetButton";
import { trackerReset } from "../../slices/gameSlice";
import { useStore } from "../../store";
import { formatTime } from "../../utils/formatTime";
import { useOverlayControls } from "../../utils/useOverlayControls";
import type { SetBoolean, SetStringArray, VideoRef } from "../../types";

const hasMoves = (): boolean => useStore.getState().game.moves !== "";

// YouTube-style controls over the camera: record and pause in one button, a reset, and how long the game has been
// recorded for.
const RecordControls = ({ videoRef, playing, setPlaying, setText, onVisible }: {
  videoRef: VideoRef,
  playing: boolean,
  setPlaying: SetBoolean,
  setText: SetStringArray,
  onVisible: (visible: boolean) => void
}) => {
  // Time recorded, in ms, which runs only while recording. Like the moves' times, it starts again when recording
  // starts on a game without moves.
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const showElapsed = useCallback((ms: number) => {
    elapsedRef.current = ms;
    setElapsed(ms);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const base = hasMoves() ? elapsedRef.current : 0;
    const start = performance.now();
    showElapsed(base);
    const id = window.setInterval(() => showElapsed(base + performance.now() - start), 250);
    return () => window.clearInterval(id);
  }, [playing, showElapsed]);

  const togglePlay = useCallback(() => setPlaying(!playing), [playing, setPlaying]);
  const { barRef, visible, poke, toggle } = useOverlayControls({ videoRef, playing, togglePlay, onVisible });

  const reset = () => {
    setPlaying(false);
    trackerReset();
    showElapsed(0);
    setText(["Reset to start position"]);
  };

  const recordLabel = playing ? "Pause (k)" : "Record (k)";

  return (
    <div ref={barRef} className={`video-controls video-controls--live${visible ? "" : " video-controls--hidden"}`}>
      <div className="video-controls__row">
        <button type="button" className="video-controls__button" onClick={toggle}
          aria-label={recordLabel} title={recordLabel}>
          {playing ? <Icon icon={Pause} filled={true} /> : <Icon icon={Circle} filled={true} className="text-2xl text-[#f00]" />}
        </button>
        <ResetButton label="Reset to the start position" onReset={reset} onPress={poke} />
        <span className="video-controls__time">
          {playing && <span className="video-controls__rec" aria-hidden="true" />}
          {playing ? "REC " : ""}{formatTime(elapsed / 1000)}
        </span>
      </div>
    </div>
  );
};

export default RecordControls;
