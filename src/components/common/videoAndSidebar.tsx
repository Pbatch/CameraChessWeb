import { useRef, useState, useEffect } from "react";
import Video from "../common/video";
import { useOutletContext } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { cornersReset, cornersSelect } from '../../slices/cornersSlice';
import { Container } from "../common";
import LoadModels from "../../utils/loadModels";
import { Context, CornersDict } from "../../types";
import RecordSidebar from "../record/recordSidebar";
import UploadSidebar from "../upload/uploadSidebar";
import { gameResetPgnAndFen } from "../../slices/gameSlice";

const VideoAndSidebar = ({ webcam }: {webcam: boolean}) => {
  const context = useOutletContext<Context>();
  const dispatch = useDispatch();
  const corners: CornersDict = cornersSelect();

  const [text, setText] = useState<string[]>([]);
  const [playing, setPlaying] = useState<boolean>(false);
  const [digital, setDigital] = useState<boolean>(false);
  
  const videoRef = useRef<any>(null);
  const playingRef = useRef<boolean>(playing);
  const canvasRef = useRef<any>(null);
  const sidebarRef = useRef<any>(null);
  const cornersRef = useRef<CornersDict>(corners);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    cornersRef.current = corners
  }, [corners])

  useEffect(() => {
    LoadModels(context.piecesModelRef, context.xcornersModelRef);
    dispatch(cornersReset())
    dispatch(gameResetPgnAndFen());
  }, []);

  const sidebarProps = {
    "videoRef": videoRef,
    "piecesModelRef": context.piecesModelRef,
    "xcornersModelRef": context.xcornersModelRef,
    "canvasRef": canvasRef,
    "sidebarRef": sidebarRef,
    "setPlaying": setPlaying,
    "setText": setText,
    "setDigital": setDigital,
    "playing": playing,
    "text": text,
    "digital": digital,
    "cornersRef": cornersRef
  }
  const sidebar = () => {
    if (webcam) {
      return <RecordSidebar {...sidebarProps} /> 
    } else {
      return <UploadSidebar {...sidebarProps} />
    }
  }
  return (
    <Container>
      {sidebar()}
      <Video modelRef={context.piecesModelRef} videoRef={videoRef} canvasRef={canvasRef} 
      sidebarRef={sidebarRef} playing={playing} setPlaying={setPlaying} playingRef={playingRef} 
      setText={setText} digital={digital} webcam={webcam} cornersRef={cornersRef} />
    </Container>
  );
};

export default VideoAndSidebar;