import { detectVideo } from "../utils/detect";

const RecordButton = ({ recording, setRecording }) => {
  const text = recording ? "Stop Recording" : "Start Recording";
  return (
    <button
      onClick={() => {
        setRecording(!recording);
      }}
    >
    {text}
    </button>
  );
};

export default RecordButton;
