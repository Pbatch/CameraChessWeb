import { useEffect, useState } from "react";
import type { VideoRef } from "../../../types";

const PlaybackButton = ({ playbackRate, videoRef, videoSelected, selectedRate, setSelectedRate }: {
  playbackRate: number,
  videoRef: VideoRef,
  videoSelected: boolean,
  selectedRate: number,
  setSelectedRate: (rate: number) => void
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (videoRef.current !== null) {
      videoRef.current.playbackRate = playbackRate;
      setSelectedRate(playbackRate);
    }
  }

  return (
    <button 
      type="button" 
      className="btn btn-secondary btn-dark btn-outline-light w-100"
      onClick={handleClick}
      disabled={!videoSelected}
      aria-label={`Set playback speed to ${playbackRate} times`}
      aria-pressed={selectedRate === playbackRate}
    >
    {playbackRate}x
    </button>
  )
}

const PlayButton = ({ videoRef, videoSelected }: { videoRef: VideoRef, videoSelected: boolean }) => {
  const [selectedRate, setSelectedRate] = useState(1);

  useEffect(() => {
    if (!videoSelected) {
      setSelectedRate(1);
    }
  }, [videoSelected]);

  const props = { videoRef, videoSelected, selectedRate, setSelectedRate };

  return (
    <div className="btn-group w-100" role="group" aria-label="Playback speed">
      <PlaybackButton playbackRate={1} {...props} />
      <PlaybackButton playbackRate={2} {...props} />
      <PlaybackButton playbackRate={4} {...props} />
    </div>
  );
};

export default PlayButton;
