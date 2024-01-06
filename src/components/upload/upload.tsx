import { useRef, useState, useEffect } from "react";
import Video from "../common/video";
import UploadSidebar from "./uploadSidebar";
import { useOutletContext } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { cornersReset } from '../../slices/cornersSlice';
import { Container } from "../common";
import LoadModels from "../../utils/loadModels";
import { Context } from "../../types";

const Upload = () => {
  const context = useOutletContext<Context>();
  const dispatch = useDispatch();

  const [text, setText] = useState<string[]>([]);
  const [playing, setPlaying] = useState<boolean>(false);
  const [digital, setDigital] = useState<boolean>(false);
  
  const videoRef = useRef<any>(null);
  const playingRef = useRef<boolean>(playing);
  const canvasRef = useRef<any>(null);
  const sidebarRef = useRef<any>(null);

  useEffect(() => {
    playingRef.current = playing;
    console.log(playing, playingRef.current);
  }, [playing]);

  useEffect(() => {
    LoadModels(context.piecesModelRef, context.xcornersModelRef);
    dispatch(cornersReset())
  }, []);

  return (
    <Container>
      <UploadSidebar videoRef={videoRef} piecesModelRef={context.piecesModelRef} xcornersModelRef={context.xcornersModelRef} 
      canvasRef={canvasRef} setText={setText} sidebarRef={sidebarRef} playing={playing} setPlaying={setPlaying}
      text={text} digital={digital} setDigital={setDigital} />
      <Video modelRef={context.piecesModelRef} videoRef={videoRef} canvasRef={canvasRef} sidebarRef={sidebarRef} 
      playing={playing} setPlaying={setPlaying} playingRef={playingRef} setText={setText} digital={digital} webcam={false} />
    </Container>
  );
};

export default Upload;
