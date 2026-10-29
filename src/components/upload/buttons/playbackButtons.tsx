import { useEffect, useState } from "react";
import type { VideoRef } from "../../../types";
import { ButtonGroup } from "../../common";
import buttonClass from "../../common/buttonClass";

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
      className={`${buttonClass()} w-full`}
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
    <ButtonGroup label="Playback speed">
      <PlaybackButton playbackRate={1} {...props} />
      <PlaybackButton playbackRate={2} {...props} />
      <PlaybackButton playbackRate={4} {...props} />
    </ButtonGroup>
  );
};

export default PlayButton;
