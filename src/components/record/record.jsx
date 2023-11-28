import { useState, useEffect, useRef } from "react";
import Video from "./video";
import RecordSidebar from "./recordSidebar.jsx";
import { useOutletContext } from "react-router-dom";

const Record = () => {
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState([]);

  const recordingRef = useRef(recording);
  const sidebarRef = useRef(null);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [piecesModelRef, xcornersModelRef] = useOutletContext();

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);
  
  return (
    <div className="d-flex bg-dark h-100">
      <RecordSidebar piecesModelRef={piecesModelRef} xcornersModelRef={xcornersModelRef} 
      canvasRef={canvasRef} webcamRef={webcamRef} sidebarRef={sidebarRef} recording={recording} setRecording={setRecording} text={text} setText={setText} />
      <Video modelRef={piecesModelRef} canvasRef={canvasRef} recordingRef={recordingRef} setText={setText} sidebarRef={sidebarRef} webcamRef={webcamRef} />
    </div>
  );
};

export default Record;
