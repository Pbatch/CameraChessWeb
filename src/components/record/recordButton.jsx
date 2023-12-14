const RecordButton = ({ recording, setRecording }) => {
  const textClass = recording ? "bi-pause" : "bi-play";
  const handleClick = (e) => {
    e.preventDefault();

    setRecording(!recording);
  }

 return (
    <button className="btn btn-dark btn-sm btn-outline-light w-100" onClick={handleClick}>
      <i className={`h4 bi ${textClass}`} />
    </button>
  );
};

export default RecordButton;
