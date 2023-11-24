const RecordButton = ({ recording, setRecording, loading }) => {
  const text = recording ? "Stop Recording" : "Start Recording";
  const handleClick = (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }
    setRecording(!recording);
  }

 return (
    <button className="btn btn-dark btn-sm btn-outline-light" onClick={handleClick}>
      {text}
    </button>
  );
};

export default RecordButton;
