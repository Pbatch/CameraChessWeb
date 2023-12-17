import { useState, useEffect, useRef } from "react";
import Webcam from "./webcam.jsx";
import RecordSidebar from "./recordSidebar.jsx";
import { useDispatch } from 'react-redux';
import { cornersReset } from '../../slices/cornersSlice.jsx';
import { useOutletContext } from "react-router-dom";
import { Container } from "../common";

const Record = () => {
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState([""]);
  const dispatch = useDispatch();

  const recordingRef = useRef(recording);
  const sidebarRef = useRef(null);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const context = useOutletContext();

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  useEffect(() => {
    dispatch(cornersReset())
  }, []);
  
  return (
    <Container>
      <RecordSidebar piecesModelRef={context.piecesModelRef} xcornersModelRef={context.xcornersModelRef} 
      canvasRef={canvasRef} webcamRef={webcamRef} sidebarRef={sidebarRef} recording={recording} setRecording={setRecording} text={text} setText={setText} />
      <Webcam modelRef={context.piecesModelRef} canvasRef={canvasRef} recordingRef={recordingRef} setText={setText} sidebarRef={sidebarRef} webcamRef={webcamRef} />
    </Container>
  );
};

export default Record;
