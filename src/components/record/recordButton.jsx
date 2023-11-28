const RecordButton = ({ recording, setRecording }) => {
  const text = recording ? "Stop Recording" : "Start Recording";
  const handleClick = (e) => {
    e.preventDefault();

    setRecording(!recording);
  }

 return (
    <button className="btn btn-dark btn-sm btn-outline-light w-100" onClick={handleClick}>
      {text}
    </button>
  );
};

export default RecordButton;
