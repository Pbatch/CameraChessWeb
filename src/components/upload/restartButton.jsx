const RestartButton = ({ videoRef }) => {
  const handleClick = (e) => {
    e.preventDefault();

    videoRef.current.currentTime = 0;
  }

 return (
    <button className="btn btn-dark btn-sm btn-outline-light w-100" onClick={handleClick}>
      <i class="h4 bi bi-skip-start"></i>
    </button>
  );
};

export default RestartButton;
