const RestartButton = ({ videoRef }) => {
  const handleClick = (e) => {
    e.preventDefault();

    videoRef.current.currentTime = 0;
  }

 return (
    <button className="btn btn-dark btn-sm btn-outline-light w-100" onClick={handleClick}>
      Restart Video
    </button>
  );
};

export default RestartButton;
