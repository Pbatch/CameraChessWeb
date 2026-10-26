import { useRef, useState, useEffect } from "react";
import Video from "../common/video";
import { useOutletContext } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { Container } from "../common";
import type { Mode, ModelRefs, Roi, Study } from "../../types";
import RecordSidebar from "../record/recordSidebar";
import UploadSidebar from "../upload/uploadSidebar";
import BroadcastSidebar from "../broadcast/broadcastSidebar";
import { gameResetFen, gameResetMoves, gameResetStart, makePgn, useGame } from "../../slices/gameSlice";
import { lichessPushRound } from "../../api/lichess";
import { useUser } from "../../slices/userSlice";
import PlaySidebar from "../play/playSidebar";
import { useMediaQuery } from "../../utils/hooks";

const PortraitWarning = () => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center gap-3 w-100 p-3 text-white text-center">
      <i className="bi bi-phone-landscape display-1" aria-hidden="true" />
      <h1 className="h4 m-0">Rotate your device to landscape</h1>
    </div>
  )
}

const VideoAndSidebar = ({ mode }: { mode: Mode }) => {
  const context = useOutletContext<ModelRefs>();
  const dispatch = useDispatch();
  const token: string = useUser().token;
  const { moves, start } = useGame();
  const isPortrait = useMediaQuery('(orientation: portrait)');

  const [text, setText] = useState<string[]>([]);
  const [fps, setFps] = useState<number | null>(null);
  const [playing, setPlaying] = useState<boolean>(false);
  const [study, setStudy] = useState<Study | null>(null);
  const [boardNumber, setBoardNumber] = useState<number>(-1);
  const [roi, setRoi] = useState<Roi | null>(null);
  const [selecting, setSelecting] = useState<boolean>(false);
  const [canPlay, setCanPlay] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playingRef = useRef<boolean>(playing);
  const roiRef = useRef<Roi | null>(roi);

  useEffect(() => {
    if (mode !== "broadcast" || (study === null) || (boardNumber === -1)) {
      return;
    }
    
    const broadcastPgn = makePgn({ moves, start }, {
      Site: `${boardNumber}`,
      White: `White ${boardNumber}`,
      Black: `Black ${boardNumber}`,
      Board: `${boardNumber}`,
      Annotator: "ChessCam"
    });
    void lichessPushRound(token, broadcastPgn, study.id)
      .catch((error: unknown) => console.error('Unable to push Lichess broadcast round.', error));
  }, [boardNumber, mode, moves, start, study, token])

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    roiRef.current = roi;
  }, [roi]);

  useEffect(() => {
    dispatch(gameResetStart());
    dispatch(gameResetMoves());
    dispatch(gameResetFen());
  }, [dispatch]);

  const props = {
    "playing": playing,
    "text": text,
    "study": study,
    "setPlaying": setPlaying,
    "setText": setText,
    "fps": fps,
    "setFps": setFps,
    "setBoardNumber": setBoardNumber,
    "setStudy": setStudy,
    "roi": roi,
    "setRoi": setRoi,
    "selecting": selecting,
    "setSelecting": setSelecting,
    "canPlay": canPlay,
    "setCanPlay": setCanPlay,
    "roiRef": roiRef,
    "chessqueriesModelRef": context.chessqueriesModelRef,
    "videoRef": videoRef,
    "playingRef": playingRef,
    "mode": mode
  }
  const renderSidebar = () => {
    switch(mode) {
      case "record": return <RecordSidebar {...props} />
      case "upload": return <UploadSidebar {...props} />
      case "play": return <PlaySidebar {...props} />
      case "broadcast": return <BroadcastSidebar {...props} />
    }
  }

  return (
    <Container className="video-and-sidebar">
      {/* Uploads play a file, so only the camera modes need landscape */}
      {(isPortrait && mode !== "upload") ? (
        <PortraitWarning />
      ) : (
        <>
          {renderSidebar()}
          <Video {...props} />
        </>
      )}
    </Container>
  );
};

export default VideoAndSidebar;
