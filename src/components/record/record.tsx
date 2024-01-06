import { useState, useEffect, useRef } from "react";
import Video from "../common/video";
import RecordSidebar from "./recordSidebar";
import { useDispatch } from 'react-redux';
import { cornersReset } from '../../slices/cornersSlice';
import { useOutletContext } from "react-router-dom";
import { Container } from "../common";
import LoadModels from "../../utils/loadModels";
import { Context } from "../../types";

const Record = () => {
  const [playing, setPlaying] = useState(false);
  const [text, setText] = useState([""]);
  const [digital, setDigital] = useState(false);
  const dispatch = useDispatch();

  const playingRef = useRef(playing);
  const sidebarRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const context = useOutletContext<Context>();

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    LoadModels(context.piecesModelRef, context.xcornersModelRef);
    dispatch(cornersReset())
  }, []);
  
  return (
    <Container>
      <RecordSidebar piecesModelRef={context.piecesModelRef} xcornersModelRef={context.xcornersModelRef} 
      canvasRef={canvasRef} videoRef={videoRef} sidebarRef={sidebarRef} 
      playing={playing} setPlaying={setPlaying} text={text} setText={setText}
      digital={digital} setDigital={setDigital} />
      <Video modelRef={context.piecesModelRef} canvasRef={canvasRef} 
      playing={playing} setPlaying={setPlaying} playingRef={playingRef}
       setText={setText} sidebarRef={sidebarRef} videoRef={videoRef} 
      digital={digital} webcam={true} />
    </Container>
  );
};

export default Record;
