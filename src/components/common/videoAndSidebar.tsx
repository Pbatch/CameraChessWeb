import i18n from "../../i18n";
import { useTranslation } from "react-i18next";
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
import { useEngineOn } from "../../slices/engineSlice";
import { detectingSet } from "../../slices/detectingSlice";
import PlaySidebar from "../play/playSidebar";
import type { StartBlock } from "./cameraControls";
import { useMediaQuery, useWakeLock } from "../../utils/hooks";
import { useCamera } from "../../utils/useCamera";
import { useStockfish } from "../../engine/useStockfish";

const PortraitWarning = () => {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 p-4 text-center text-white">
      {/* A phone on its side */}
      <Icon icon={Smartphone} className="rotate-90 text-[5rem]" />
      <h1 className="text-2xl/[1.2] font-medium">{t("common.rotate")}</h1>
    </div>
  )
}

const VideoAndSidebar = ({ mode }: { mode: Mode }) => {
  const context = useOutletContext<ModelRefs>();
  const token: string = useUser().token;
  const { moves, start, fen } = useGame();
  const isPortrait = useMediaQuery('(orientation: portrait)');

  const [text, setText] = useState<string[]>([]);
  const [playing, setPlaying] = useState<boolean>(false);
  const [study, setStudy] = useState<Study | null>(null);
  const [boardNumber, setBoardNumber] = useState<number>(-1);
  const [roi, setRoi] = useState<Roi | null>(null);
  const [selecting, setSelecting] = useState<boolean>(false);
  const [canPlay, setCanPlay] = useState<boolean>(false);
  // Play mode's game, which its sidebar chooses
  const [gameSelected, setGameSelected] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Uploads play a file, and in portrait no video is shown
  const showCamera = (mode !== "upload") && !isPortrait;
  const camera = useCamera({ enabled: showCamera, videoRef, setText });

  // Stockfish runs while the eval bar is on (see engineSlice for when), and keeps analysing while paused, as the bar
  // still shows
  const engineEnabled: boolean = useEngineOn(mode);

  // Detection waits until there's somewhere for the moves to go, as they'd otherwise go nowhere without a word
  const startBlock: StartBlock | null = ((mode === "play") && !gameSelected) ? "camera.selectGameFirst"
    : ((mode === "broadcast") && ((study === null) || (boardNumber === -1))) ? "camera.selectStudyBoardFirst"
    : null;

  // Says so in the status too, which phones show (the start button's label is only read out), and takes it away once
  // chosen, unless something else has been said since
  const shownBlock = useRef<string | null>(null);
  useEffect(() => {
    const hint: string | null = (startBlock === null) ? null : i18n.t(startBlock);
    const previous: string | null = shownBlock.current;
    shownBlock.current = hint;
    setText((text) => {
      if (hint !== null) return [hint];
      return ((previous !== null) && (text.length === 1) && (text[0] === previous)) ? [] : text;
    });
  }, [startBlock]);
  useStockfish(fen, engineEnabled);

  // For the header, which can't sign out mid-game
  useEffect(() => {
    detectingSet(playing);
    return () => detectingSet(false);
  }, [playing]);

  // A game can outlast the screen's timeout, which would stop the camera or the video
  useWakeLock(playing);

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
        const message: string = i18n.t("broadcast.updateFailed", { reason: describeLichessError(error) });
        errorShow({ source: "broadcast", message: isTransientError(error) ? i18n.t("broadcast.willRetry", { message }) : message });
      });
  }, [boardNumber, mode, moves, start, study, token])

  // A broadcast or engine error no longer applies once the page is left
  useEffect(() => {
    return () => {
      errorClear("broadcast");
      errorClear("engine");
    };
  }, []);

  useEffect(() => {
    gameReset();
  }, []);

  const props = {
    playing,
    text,
    study,
    setPlaying,
    setText,
    boardNumber,
    setBoardNumber,
    setStudy,
    roi,
    setRoi,
    selecting,
    setSelecting,
    canPlay,
    setCanPlay,
    modelRef: context.modelRef,
    videoRef,
    camera,
    mode,
    engineEnabled,
    startBlock,
    setGameSelected
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
