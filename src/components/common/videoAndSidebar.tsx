import { useRef, useState, useEffect } from "react";
import Video from "../common/video";
import { useOutletContext } from "react-router";
import { Smartphone } from "lucide-react";
import { Container, Icon } from "../common";
import type { Mode, ModelRefs, Roi, Study } from "../../types";
import RecordSidebar from "../record/recordSidebar";
import UploadSidebar from "../upload/uploadSidebar";
import BroadcastSidebar from "../broadcast/broadcastSidebar";
import { gameReset, makePgn, useGame } from "../../slices/gameSlice";
import { describeLichessError, isTransientError, lichessPushRound } from "../../api/lichess";
import { errorClear, errorShow } from "../../slices/errorSlice";
import { useUser } from "../../slices/userSlice";
import PlaySidebar from "../play/playSidebar";
import { useMediaQuery } from "../../utils/hooks";
import { useCamera } from "../../utils/useCamera";

const PortraitWarning = () => {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 p-4 text-center text-white">
      {/* A phone on its side */}
      <Icon icon={Smartphone} className="rotate-90 text-[5rem]" />
      <h1 className="text-2xl/[1.2] font-medium">Rotate your device to landscape</h1>
    </div>
  )
}

const VideoAndSidebar = ({ mode }: { mode: Mode }) => {
  const context = useOutletContext<ModelRefs>();
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

  // Uploads play a file, and in portrait no video is shown
  const showCamera = (mode !== "upload") && !isPortrait;
  const camera = useCamera({ enabled: showCamera, videoRef, setText });

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
      .then(() => errorClear("broadcast"))
      .catch((error: unknown) => {
        console.error('Unable to push Lichess broadcast round.', error);
        // Each push sends the whole game, so the next move catches the broadcast up
        const retry: string = isTransientError(error) ? " It will retry on the next move." : "";
        errorShow({ source: "broadcast", message: `Unable to update the Lichess broadcast. ${describeLichessError(error)}${retry}` });
      });
  }, [boardNumber, mode, moves, start, study, token])

  // A broadcast error no longer applies once the broadcast is left
  useEffect(() => {
    return () => {
      errorClear("broadcast");
    };
  }, []);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    roiRef.current = roi;
  }, [roi]);

  useEffect(() => {
    gameReset();
  }, []);

  const props = {
    playing,
    text,
    study,
    setPlaying,
    setText,
    fps,
    setFps,
    setBoardNumber,
    setStudy,
    roi,
    setRoi,
    selecting,
    setSelecting,
    canPlay,
    setCanPlay,
    roiRef,
    chessqueriesModelRef: context.chessqueriesModelRef,
    videoRef,
    camera,
    playingRef,
    mode
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
