import Button from 'react-bootstrap/Button';

const RecordButton = ({ recording, setRecording }) => {
  const text = recording ? "Stop Recording" : "Start Recording";
  return (
    <Button
      onClick={() => {
        setRecording(!recording);
      }}
    >
    {text}
    </Button>
  );
};

export default RecordButton;
