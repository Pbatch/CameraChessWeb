import { CornersButton, Sidebar, RecordButton, DeviceButton } from "../common";
import { Game, PlayInputMode, SetBoolean, SetStringArray, VoiceLanguage } from "../../types";
import { useUser } from "../../slices/userSlice";
import { useEffect, useRef, useState } from "react";
import { BoardStreamEvent, errorMessage, lichessPlayMove, lichessStreamGame } from "../../utils/lichess";
import { Color } from "chessops/types";
import { useDispatch } from "react-redux";
import { gameUpdate, gameSetError, gameSetStart, gameSetSyncRequired, makeBoardFromUci, makeUpdatePayload, useGame } from "../../slices/gameSlice";
import GamesButton from "./gamesButton";
import { START_FEN } from "../../utils/constants";
import VoiceControl from "./voiceControl";

const PlaySidebar = ({ piecesModelRef, xcornersModelRef, videoRef, canvasRef, sidebarRef,
  playing, setPlaying, text, setText, playInputMode, setPlayInputMode, voiceLanguage, setVoiceLanguage }: {
    piecesModelRef: any, xcornersModelRef: any, videoRef: any, canvasRef: any, sidebarRef: any,
    playing: boolean, setPlaying: SetBoolean,
    text: string[], setText: SetStringArray,
    playInputMode: PlayInputMode, setPlayInputMode: (mode: PlayInputMode) => void,
    voiceLanguage: VoiceLanguage, setVoiceLanguage: (language: VoiceLanguage) => void
  }) => {
  const token: string = useUser().token;
  const game: Game = useGame();
  const gameRef = useRef<Game>(game);
  const [gameId, setGameId] = useState<string>();
  const [color, setColor] = useState<Color>();
  const [streamRevision, setStreamRevision] = useState(0);
  const remoteMovesRef = useRef<string[]>([]);
  const remoteStartRef = useRef(START_FEN);
  const dispatch = useDispatch();
  const inputStyle = {
    display: playing ? "none" : "inline-block"
  }

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    remoteMovesRef.current = [];
    remoteStartRef.current = START_FEN;
  }, [gameId]);

  useEffect(() => {
    const colorToMove = game.fen.split(" ")[1];
    const lastMove = game.lastMove;
    const fromOpponent = game.fromOpponent;
    if ((colorToMove === color) || (lastMove === "") || (gameId === undefined) || (color === undefined) || fromOpponent || game.syncRequired) {
      return;
    }

    lichessPlayMove(token, gameId, lastMove)
      .catch((error: unknown) => {
        dispatch(gameSetError(errorMessage(error)));
        dispatch(gameSetSyncRequired(playInputMode === "camera"));
        remoteMovesRef.current = [];
        setStreamRevision((revision) => revision + 1);
      });
  }, [color, dispatch, game, gameId, playInputMode, token])

  useEffect(() => {
    if (playInputMode === "voice" && game.syncRequired) {
      dispatch(gameSetSyncRequired(false));
    }
  }, [dispatch, game.syncRequired, playInputMode]);

  useEffect(() => {
    if (gameId === undefined) {
      return;
    }

    const streamGameCallback = async (response: BoardStreamEvent) => {
      const movesText = response.type === "gameFull" ? response.state?.moves : response.moves;
      if (movesText === undefined) {
        return;
      }

      if (response.type === "gameFull") {
        remoteStartRef.current = response.initialFen && response.initialFen !== "startpos"
          ? response.initialFen
          : START_FEN;
      }

      const nextMoves = movesText.trim().split(/\s+/).filter(Boolean);
      const previousMoves = remoteMovesRef.current;
      const isInitialSnapshot = response.type === "gameFull" && previousMoves.length === 0;
      const isSimpleAppend = nextMoves.length >= previousMoves.length
        && previousMoves.every((move, index) => nextMoves[index] === move);
      const changed = nextMoves.length !== previousMoves.length
        || nextMoves.some((move, index) => move !== previousMoves[index]);
      if (!changed && !isInitialSnapshot) {
        return;
      }

      try {
        const board = makeBoardFromUci(remoteStartRef.current, movesText);
        const requiresSync = playInputMode === "camera" && !isInitialSnapshot && !isSimpleAppend;
        const payload = {
          ...makeUpdatePayload(board, false, true),
          syncRequired: requiresSync || gameRef.current.syncRequired
        };
        remoteMovesRef.current = nextMoves;
        dispatch(gameSetStart(remoteStartRef.current));
        dispatch(gameUpdate(payload));
        if (requiresSync) {
          setText(["Desynchronization detected", "Rearrange the pieces to match Lichess"]);
        }
      } catch (error: unknown) {
        dispatch(gameSetError(errorMessage(error)));
        dispatch(gameSetSyncRequired(playInputMode === "camera"));
      }
    };

    const controller = lichessStreamGame(token, streamGameCallback, gameId, () => {
      setText(["Lichess connection interrupted", "Reconnecting automatically..."]);
    });
    return () => controller.abort();
  }, [dispatch, gameId, playInputMode, setText, streamRevision, token]);

  return (
    <Sidebar sidebarRef={sidebarRef} playing={playing} text={text} setText={setText} >
      <li className="my-1" style={inputStyle}>
        <div className="btn-group w-100" role="group" aria-label="Modo de entrada">
          <button type="button" className={`btn btn-sm btn-outline-light ${playInputMode === "camera" ? "btn-light text-dark" : "btn-dark"}`}
            onClick={() => setPlayInputMode("camera")}>Cámara</button>
          <button type="button" className={`btn btn-sm btn-outline-light ${playInputMode === "voice" ? "btn-light text-dark" : "btn-dark"}`}
            onClick={() => setPlayInputMode("voice")}>🎙 Voz</button>
        </div>
      </li>
      {playInputMode === "voice" && !playing && (
        <li className="my-1">
          <div className="btn-group w-100" role="group" aria-label="Idioma de voz">
            <button type="button" className={`btn btn-sm btn-outline-light ${voiceLanguage === "es-ES" ? "btn-light text-dark" : "btn-dark"}`}
              onClick={() => setVoiceLanguage("es-ES")}>Español</button>
            <button type="button" className={`btn btn-sm btn-outline-light ${voiceLanguage === "en-US" ? "btn-light text-dark" : "btn-dark"}`}
              onClick={() => setVoiceLanguage("en-US")}>English</button>
          </div>
        </li>
      )}
      <li className="my-1" style={{ ...inputStyle, display: !playing && playInputMode === "camera" ? "inline-block" : "none" }}>
        <DeviceButton videoRef={videoRef} />
      </li>
      <li className="my-1" style={{ ...inputStyle, display: !playing && playInputMode === "camera" ? "inline-block" : "none" }}>
        <GamesButton setGameId={setGameId} setColor={setColor} setText={setText} />
      </li>
      <li className="my-1" style={inputStyle}>
        <CornersButton piecesModelRef={piecesModelRef} xcornersModelRef={xcornersModelRef} videoRef={videoRef} canvasRef={canvasRef}
          setText={setText} />
      </li>
      <li className="my-1">
        <div className="btn-group w-100" role="group">
          <RecordButton playing={playing} setPlaying={setPlaying} />
        </div>
      </li>
      {playInputMode === "voice" && <VoiceControl active={playing} color={color} language={voiceLanguage} setText={setText} />}
      {playInputMode === "camera" && game.syncRequired && (
        <li className="alert alert-warning py-2 px-3 my-2" role="alert">
          <strong>Desynchronization</strong><br />
          Rearrange the physical pieces to match Lichess. Detection will resume automatically.
        </li>
      )}
    </Sidebar>
  );
};

export default PlaySidebar;
