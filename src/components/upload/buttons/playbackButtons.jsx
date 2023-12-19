const PlayButton = ({ videoRef }) => {
  const PlaybackButton = ({ playbackRate} ) => {
    const handleClick = (e) => {
      e.preventDefault();
      videoRef.current.playbackRate = playbackRate 
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
    <div className="btn-group" role="group">
      <PlaybackButton playbackRate={1} />
      <PlaybackButton playbackRate={2} /> 
      <PlaybackButton playbackRate={4} />
    </div>
  );
};

export default PlayButton;
