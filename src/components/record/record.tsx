import { useState, useEffect, useRef } from "react";
import Webcam from "./webcam";
import RecordSidebar from "./recordSidebar";
import { useDispatch } from 'react-redux';
import { cornersReset } from '../../slices/cornersSlice';
import { useOutletContext } from "react-router-dom";
import { Container } from "../common";
import LoadModels from "../../utils/loadModels";
import { Context } from "../../types";

const Record = () => {
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState([""]);
  const [digital, setDigital] = useState(false);
  const dispatch = useDispatch();

  const recordingRef = useRef(recording);
  const sidebarRef = useRef(null);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const context = useOutletContext<Context>();

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  useEffect(() => {
    LoadModels(context.piecesModelRef, context.xcornersModelRef);
    dispatch(cornersReset())
  }, []);
  
  return (
    <Container>
      <RecordSidebar piecesModelRef={context.piecesModelRef} xcornersModelRef={context.xcornersModelRef} 
      canvasRef={canvasRef} webcamRef={webcamRef} sidebarRef={sidebarRef} recording={recording} setRecording={setRecording} text={text} setText={setText}
      digital={digital} setDigital={setDigital} />
      <Webcam modelRef={context.piecesModelRef} canvasRef={canvasRef} recordingRef={recordingRef} setText={setText} sidebarRef={sidebarRef} webcamRef={webcamRef} 
      digital={digital} />
    </Container>
  );
};

export default Record;
