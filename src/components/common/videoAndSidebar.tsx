import { useRef, useState, useEffect } from "react";
import Video from "../common/video";
import { useOutletContext } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { cornersReset, cornersSelect } from '../../slices/cornersSlice';
import { Container } from "../common";
import LoadModels from "../../utils/loadModels";
import { CornersDict, Mode, ModelRefs, Study } from "../../types";
import RecordSidebar from "../record/recordSidebar";
import UploadSidebar from "../upload/uploadSidebar";
import BroadcastSidebar from "../broadcast/broadcastSidebar";
import { gameResetFen, gameResetMoves, gameResetStart, gameSelect } from "../../slices/gameSlice";
import { lichessPushRound } from "../../utils/lichess";
import { userSelect } from "../../slices/userSlice";
import { START_FEN } from "../../utils/constants";
import PlaySidebar from "../play/playSidebar";

const VideoAndSidebar = ({ mode }: { mode: Mode }) => {
  const context = useOutletContext<ModelRefs>();
  const dispatch = useDispatch();
  const corners: CornersDict = cornersSelect();
  const token: string = userSelect().token;
  const moves: string = gameSelect().moves;

  const [text, setText] = useState<string[]>([]);
  const [playing, setPlaying] = useState<boolean>(false);
  const [study, setStudy] = useState<Study | null>(null);
  const [boardNumber, setBoardNumber] = useState<number>(-1)
  const [digital, setDigital] = useState<boolean>(false);
  
  const videoRef = useRef<any>(null);
  const playingRef = useRef<boolean>(playing);
  const canvasRef = useRef<any>(null);
  const sidebarRef = useRef<any>(null);
  const cornersRef = useRef<CornersDict>(corners);

  useEffect(() => {
    if (!(mode === "broadcast") || (study === null) || (boardNumber === -1)) {
      return;
    }
    const broadcastPgn = [
      `[Result "*"]`,
      `[FEN "${START_FEN}"]`,
      `[Board "${boardNumber}"]`,
      `[Site "${boardNumber}"]`,
      "",
      moves
    ].join("\r");
    lichessPushRound(token, broadcastPgn, study.id);
  }, [moves])

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    cornersRef.current = corners
  }, [corners])

  useEffect(() => {
    LoadModels(context.piecesModelRef, context.xcornersModelRef);
    dispatch(cornersReset());
    dispatch(gameResetStart());
    dispatch(gameResetMoves());
    dispatch(gameResetFen());
  }, []);

  const props = {
    "playing": playing,
    "text": text,
    "digital": digital,
    "study": study,
    "setPlaying": setPlaying,
    "setText": setText,
    "setDigital": setDigital,
    "setBoardNumber": setBoardNumber,
    "setStudy": setStudy,
    "piecesModelRef": context.piecesModelRef,
    "xcornersModelRef": context.xcornersModelRef,
    "videoRef": videoRef,
    "canvasRef": canvasRef,
    "sidebarRef": sidebarRef,
    "cornersRef": cornersRef,
    "playingRef": playingRef,
    "mode": mode
  }
  const sidebar = () => {
    if (mode === "record") {
      return <RecordSidebar {...props} /> 
    } else if (mode == "upload") {
      return <UploadSidebar {...props} />
    } else if (mode == "play") {
      return <PlaySidebar {...props} />
    } else {
      // mode == "broadcast"
      return <BroadcastSidebar {...props} />
    }
  }
  return (
    <Container>
      {sidebar()}
      <Video {...props} />
    </Container>
  );
};

export default VideoAndSidebar;