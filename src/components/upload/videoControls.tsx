import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import Icon from "../common/icon";
import ResetButton from "../common/resetButton";
import { trackerReset } from "../../slices/gameSlice";
import { formatTime } from "../../utils/formatTime";
import { useOverlayControls } from "../../utils/useOverlayControls";
import type { SetBoolean, SetStringArray, VideoRef } from "../../types";

const SPEEDS = [1, 2, 4];
const SEEK_STEP = 5;

// YouTube-style controls over the bottom of an uploaded video: a seek bar, play/pause, a tracker reset, the time and
// the speed. The arrows seek too.
const VideoControls = ({ videoRef, playing, setPlaying, setText, onVisible }: {
  videoRef: VideoRef,
  playing: boolean,
  setPlaying: SetBoolean,
  setText: SetStringArray,
  onVisible: (visible: boolean) => void
}) => {
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [ended, setEnded] = useState(false);
  const [hover, setHover] = useState<{ x: number, time: number } | null>(null);

  // Follows the video. The time updates every frame while playing, as timeupdate only fires a few times a second.
  useEffect(() => {
    const video = videoRef.current;
    if (video === null) return;

    const sync = () => {
      setTime(video.currentTime);
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      setEnded(video.ended);
      setSpeed(video.playbackRate);
    };
    sync();
    const events = ["timeupdate", "durationchange", "loadedmetadata", "seeked", "ratechange", "ended", "play"];
    for (const event of events) video.addEventListener(event, sync);

    let frame = 0;
    const tick = () => {
      setTime(video.currentTime);
      frame = requestAnimationFrame(tick);
    };
    if (playing) frame = requestAnimationFrame(tick);

    return () => {
      for (const event of events) video.removeEventListener(event, sync);
      cancelAnimationFrame(frame);
    };
  }, [videoRef, playing]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (video === null) return;
    // From the end, playing starts again from the beginning, as on YouTube
    if (!playing && video.ended) {
      video.currentTime = 0;
    }
    setPlaying(!playing);
  }, [playing, setPlaying, videoRef]);

  // Seeking always pauses, so the game can be checked against the new frame (and the tracker reset) before
  // detection goes on from there
  const seekTo = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (video === null || !Number.isFinite(video.duration)) return;
    setPlaying(false);
    video.currentTime = Math.min(Math.max(seconds, 0), video.duration);
    setTime(video.currentTime);
  }, [setPlaying, videoRef]);

  const onKey = useCallback((e: KeyboardEvent): boolean => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return false;
    seekTo((videoRef.current?.currentTime ?? 0) + ((e.key === "ArrowLeft") ? -SEEK_STEP : SEEK_STEP));
    return true;
  }, [seekTo, videoRef]);

  const { barRef, visible, poke, toggle } = useOverlayControls({
    videoRef, playing, togglePlay, onVisible, held: hover !== null, onKey
  });

  const cycleSpeed = () => {
    const video = videoRef.current;
    if (video === null) return;
    video.playbackRate = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    poke();
  };

  const resetTracker = () => {
    trackerReset();
    setText(["Reset tracker", "Reset PGN to start position"]);
  };

  // Pauses as soon as the seek bar is pressed, so detection stops before the first frame skimmed past
  const onSeekStart = (e: React.PointerEvent<HTMLInputElement>) => {
    // Keeps the drag going when the pointer leaves the bar
    e.currentTarget.setPointerCapture(e.pointerId);
    setPlaying(false);
  };

  const onSeekHover = (e: React.PointerEvent<HTMLInputElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    setHover({ x: fraction * rect.width, time: fraction * duration });
  };

  const progress = (duration > 0) ? (100 * time / duration) : 0;
  const playLabel = playing ? "Pause (k)" : (ended ? "Replay" : "Play (k)");

  return (
    <div ref={barRef} className={`video-controls${visible ? "" : " video-controls--hidden"}`}>
      <div className="video-controls__seek">
        {hover !== null && (
          <span className="video-controls__hover-time" style={{ left: hover.x }}>{formatTime(hover.time)}</span>
        )}
        <input type="range" className="video-controls__range" aria-label="Seek"
          aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
          min={0} max={duration || 0} step="any" value={time}
          style={{ "--progress": `${progress}%` } as CSSProperties}
          onChange={(e) => seekTo(Number(e.target.value))}
          onPointerDown={onSeekStart}
          onPointerMove={onSeekHover} onPointerLeave={() => setHover(null)} />
      </div>
      <div className="video-controls__row">
        <button type="button" className="video-controls__button" onClick={toggle}
          aria-label={playLabel} title={playLabel}>
          <Icon icon={playing ? Pause : (ended ? RotateCcw : Play)} filled={!ended} />
        </button>
        <ResetButton label="Reset tracker to the start position" onReset={resetTracker} onPress={poke} />
        <span className="video-controls__time">{formatTime(time)} / {formatTime(duration)}</span>
        <button type="button" className="video-controls__button video-controls__speed ms-auto" onClick={cycleSpeed}
          aria-label={`Playback speed ${speed}x`} title="Playback speed">
          {speed}x
        </button>
      </div>
    </div>
  );
};

export default VideoControls;
