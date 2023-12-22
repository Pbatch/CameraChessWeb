import { useRef, useState, useEffect } from "react";
import Video from "./video";
import VideoSidebar from "./videoSidebar";
import { useOutletContext } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { cornersReset } from '../../slices/cornersSlice';
import { Container } from "../common";
import LoadModels from "../../utils/loadModels";

const Upload = () => {
  const context = useOutletContext();
  const dispatch = useDispatch();

  const [text, setText] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [digital, setDigital] = useState(false);
  
  const videoRef = useRef(null);
  const playingRef = useRef(playing);
  const canvasRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    LoadModels(context.piecesModelRef, context.xcornersModelRef);
    dispatch(cornersReset())
  }, []);

  return (
    <Container>
      <VideoSidebar videoRef={videoRef} piecesModelRef={context.piecesModelRef} xcornersModelRef={context.xcornersModelRef} 
      canvasRef={canvasRef} setText={setText} sidebarRef={sidebarRef} playing={playing} setPlaying={setPlaying}
      text={text} digital={digital} setDigital={setDigital} />
      <Video modelRef={context.piecesModelRef} videoRef={videoRef} canvasRef={canvasRef} sidebarRef={sidebarRef} 
      playing={playing} setPlaying={setPlaying} playingRef={playingRef} setText={setText} digital={digital} />
    </Container>
  );
};

export default Upload;
