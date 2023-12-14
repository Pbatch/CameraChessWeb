const PlayButton = ({ videoRef, playing, setPlaying }) => {
  const textClass = playing ? "bi-pause" : "bi-play";
  const handleClick = (e) => {
    e.preventDefault();
    
    if (videoRef.current.src.startsWith("blob")) {
      setPlaying(!playing);
    }
  }

 return (
    <button className="btn btn-dark btn-sm btn-outline-light w-100" onClick={handleClick}>
      <i class={`h4 bi ${textClass}`}></i>
    </button>
  );
};

export default PlayButton;
