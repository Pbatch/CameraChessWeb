import { VideoRef } from "../../../types";

const PlayButton = ({ videoRef }: { videoRef: VideoRef }) => {
  const PlaybackButton = ({ playbackRate}: { playbackRate: number } ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (videoRef.current !== null) {
        videoRef.current.playbackRate = playbackRate;
      }
    }
    
    return (
      <button 
        type="button" 
        className="btn btn-secondary btn-dark btn-outline-light w-100"
        onClick={handleClick}
      >
      {playbackRate}x
      </button>
    )
  }

  return (
    <div className="btn-group w-100" role="group">
      <PlaybackButton playbackRate={1} />
      <PlaybackButton playbackRate={2} /> 
      <PlaybackButton playbackRate={4} />
    </div>
  );
};

export default PlayButton;
