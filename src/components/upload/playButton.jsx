const PlayButton = ({ playing, setPlaying }) => {
  const text = playing ? "Stop Video" : "Start Video";
  const handleClick = (e) => {
    e.preventDefault();

    setPlaying(!playing);
  }

 return (
    <button className="btn btn-dark btn-sm btn-outline-light w-100" onClick={handleClick}>
      {text}
    </button>
  );
};

export default PlayButton;
