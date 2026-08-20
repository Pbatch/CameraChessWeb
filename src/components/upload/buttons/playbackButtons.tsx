import { useEffect, useState } from "react";
import type { VideoRef } from "../../../types";

const PlayButton = ({ videoRef, videoSelected }: { videoRef: VideoRef, videoSelected: boolean }) => {
  const [selectedRate, setSelectedRate] = useState(1);

  useEffect(() => {
    if (!videoSelected) {
      setSelectedRate(1);
    }
  }, [videoSelected]);

  const PlaybackButton = ({ playbackRate}: { playbackRate: number } ) => {
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

  return (
    <div className="btn-group w-100" role="group" aria-label="Playback speed">
      <PlaybackButton playbackRate={1} />
      <PlaybackButton playbackRate={2} /> 
      <PlaybackButton playbackRate={4} />
    </div>
  );
};

export default PlayButton;
