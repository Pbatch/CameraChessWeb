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
import { lichessGetRound, lichessPushRound } from "../../utils/lichess";
import { userSelect } from "../../slices/userSlice";
import { START_FEN } from "../../utils/constants";
import PlaySidebar from "../play/playSidebar";
import { useMediaQuery } from 'react-responsive';

const PortraitWarning = () => {
  return (
    <h1 className="text-white text-center w-100 p-3 h-2">
      Please use your device in landscape mode
    </h1>
  )
}

const VideoAndSidebar = ({ mode }: { mode: Mode }) => {
  const context = useOutletContext<ModelRefs>();
  const dispatch = useDispatch();
  const corners: CornersDict = cornersSelect();
  const token: string = userSelect().token;
  const moves: string = gameSelect().moves;
  const isPortrait = useMediaQuery({ orientation: 'portrait' });

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
    if (mode !== "broadcast" || (study === null) || (boardNumber === -1)) {
      return;
    }
    
    lichessGetRound(token, study.id).then((lichessPgn) => {
      const lichessGames: string[] = lichessPgn.split(/\n\n\n/);
      let matchedGame: string = "";
      lichessGames.forEach((lichessGame: string) => {
        if (lichessGame.includes(`[Board "${boardNumber}"]`)) {
          matchedGame = lichessGame;
        }
      });
      let tags: string[];
      if (matchedGame === "") {
        tags = [
          `[Result "*"]`,
          `[FEN "${START_FEN}"]`,
          `[Board "${boardNumber}"]`,
          `[Site "${boardNumber}"]`,
          `[Annotator "ChessCam"]`
        ]
      } else {
        const matches = matchedGame.match(/\[(.*?)\]/g);
        if (matches === null) {
          throw Error(`Could not find any tags in ${matchedGame}`);
        }
        tags = matches.filter((tag) => {
          const badStarts: string[] = [
            "[Event", 
            "[Annotator", 
            "[Variant",
            "[ECO",
            "[Opening",
            "[UTCDate",
            "[UTCTime",
          ];
          for (let i=0; i < badStarts.length; i++) {
            if (tag.startsWith(badStarts[i])) {
              return false;
            }
          }
          return true;
        })
      }
      const broadcastPgn = [
        ...tags,
        "",
        moves
      ].join("\r");
      lichessPushRound(token, broadcastPgn, study.id);
    });
  }, [moves])

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    cornersRef.current = corners;
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
  const Sidebar = () => {
    switch(mode) {
      case "record": return <RecordSidebar {...props} />
      case "upload": return <UploadSidebar {...props} />
      case "play": return <PlaySidebar {...props} />
      case "broadcast": return <BroadcastSidebar {...props} />
    }
  }

  return (
    <Container>
      {isPortrait ? (
        <PortraitWarning />
      ) : (
        <>
          {Sidebar()}
          <Video {...props} />
        </>
      )}
    </Container>
  );
};

export default VideoAndSidebar;