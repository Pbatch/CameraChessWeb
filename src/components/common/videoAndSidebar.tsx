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
import { gameResetPgnAndFen, gameResetStart, gameSelect } from "../../slices/gameSlice";

const VideoAndSidebar = ({ webcam }: {webcam: boolean}) => {
  const context = useOutletContext<Context>();
  const dispatch = useDispatch();
  const corners: CornersDict = cornersSelect();
  const pgn: string = gameSelect().pgn;

  const [text, setText] = useState<string[]>([]);
  const [playing, setPlaying] = useState<boolean>(false);
  const [digital, setDigital] = useState<boolean>(false);
  const [boardNumber, setBoardNumber] = useState<number>(-1);
  const [round, setRound] = useState<string>("");
  
  const videoRef = useRef<any>(null);
  const playingRef = useRef<boolean>(playing);
  const canvasRef = useRef<any>(null);
  const sidebarRef = useRef<any>(null);
  const cornersRef = useRef<CornersDict>(corners);

  useEffect(() => {
    if (!(webcam) || (round.length !== 8) || (boardNumber === -1)) {
      return;
    }

    const emptyGame = [
      `[Result "*"]`,
      "",
      "",
      "",
      ""
    ]
    const url = `/api/broadcast/round/${round}/push`;
    const prelines = new Array(boardNumber - 1).fill(emptyGame).flat();
    const postlines = new Array(64 - boardNumber).fill(emptyGame).flat();
    const game = [
      `[Result "*"]`,
      pgn,
      "",
      ""
    ];
    const lines = prelines.concat(game, postlines);
    const body = lines.join("\r\n");
    const config = {body: body, method: "POST"};
    context.authRef.current.fetchBody(url, config);
  }, [pgn])

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
    dispatch(gameResetPgnAndFen());
  }, []);

  const props = {
    "playing": playing,
    "text": text,
    "digital": digital,
    "setPlaying": setPlaying,
    "setText": setText,
    "setDigital": setDigital,
    "setBoardNumber": setBoardNumber,
    "setRound": setRound,
    "piecesModelRef": context.piecesModelRef,
    "xcornersModelRef": context.xcornersModelRef,
    "videoRef": videoRef,
    "canvasRef": canvasRef,
    "sidebarRef": sidebarRef,
    "cornersRef": cornersRef,
    "playingRef": playingRef
  }
  const sidebar = () => {
    if (webcam) {
      return <RecordSidebar {...props} /> 
    } else {
      return <UploadSidebar {...props} />
    }
  }
  return (
    <Container>
      {sidebar()}
      <Video {...props} webcam={webcam} />
    </Container>
  );
};

export default VideoAndSidebar;