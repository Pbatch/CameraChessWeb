import { CornersButton, Sidebar, RecordButton, DeviceButton } from "../common";
import type {
  CanvasRef, Game, ModelRefs, SetBoolean, SetStringArray, SidebarRef, VideoRef
} from "../../types";
import { useUser } from "../../slices/userSlice";
import { useEffect, useRef, useState } from "react";
import { lichessPlayMove, lichessStreamGame } from "../../utils/lichess";
import type { BoardStreamEvent } from "../../utils/lichess";
import type { Color } from "chessops/types";
import { useDispatch } from "react-redux";
import { gameUpdate, gameSetError, makeBoard, makeUpdatePayload, useGame, gameSetClock } from "../../slices/gameSlice";
import GamesButton from "./gamesButton";

const PlaySidebar = ({ piecesModelRef, xcornersModelRef, videoRef, canvasRef, sidebarRef,
  playing, setPlaying, text, setText }: {
    piecesModelRef: ModelRefs["piecesModelRef"],
    xcornersModelRef: ModelRefs["xcornersModelRef"],
    videoRef: VideoRef,
    canvasRef: CanvasRef,
    sidebarRef: SidebarRef,
    playing: boolean, setPlaying: SetBoolean,
    text: string[], setText: SetStringArray
  }) => {
  const token: string = useUser().token;
  const game: Game = useGame();
  const gameRef = useRef<Game>(game);
  const [gameId, setGameId] = useState<string>();
  const [color, setColor] = useState<Color>();
  const dispatch = useDispatch();
  const inputStyle = {
    display: playing ? "none" : "inline-block"
  }

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    const colorToMove = game.fen.split(" ")[1];
    const lastMove = game.lastMove;
    const fromOpponent = game.fromOpponent;
    if ((colorToMove === color) || (lastMove === "") || (gameId === undefined) || (color === undefined) || fromOpponent) {
      return;
    }

    const getFriendlyError = (error: unknown): string => {
      const raw = error instanceof Error ? error.message : String(error);
      const match = raw.match(/^(\d{3})\s*:/);
      if (match) {
        const status = Number(match[1]);
        if (status === 400) return "This mode can't be played through the API. Try a Rapid or Classical.";
        if (status === 401) return "You're not signed in. Please log in again.";
        if (status === 403) return "You don't have permission to do that.";
        if (status === 404) return "That game doesn't exist.";
        if (status >= 500) return "Lichess is having a moment. Try again shortly.";
      }
      return raw;
    };

    lichessPlayMove(token, gameId, lastMove)
      .catch((error: unknown) => {
        dispatch(gameSetError(getFriendlyError(error)));
      });
  }, [color, dispatch, game, gameId, token])

  useEffect(() => {
    if (gameId === undefined) {
      return;
    }

    const streamGameCallback = async (response: BoardStreamEvent) => {
      // gameFull nests clock data under `state`; gameState puts it at the top level.
      const data = response.type === "gameFull" ? response.state : response;

      if (data === undefined) return;

      const moves = data.moves;
      if (moves === undefined) return;

      const wtime = data.wtime;
      const btime = data.btime;
      const status = data.status;

      if (wtime !== undefined && btime !== undefined) {
        const moveCount = moves.trim() === "" ? 0 : moves.trim().split(" ").length;
        dispatch(gameSetClock({
          wtime,
          btime,
          turn: moveCount % 2 === 0 ? "w" : "b",
          updatedAt: Date.now(),
          running: status === "started",
        }));
      }

      const splitMoves = moves.split(" ");
      const lastMove = splitMoves[splitMoves.length - 1];
      if (lastMove === gameRef.current.lastMove) return;

      const board = makeBoard(gameRef.current);
      board.playUci(lastMove);
      const payload = makeUpdatePayload(board, false, true);
      dispatch(gameUpdate(payload));
    };

    const controller = lichessStreamGame(token, streamGameCallback, gameId);
    return () => controller.abort();
  }, [dispatch, gameId, token]);

  return (
    <Sidebar sidebarRef={sidebarRef} playing={playing} text={text} setText={setText} >
      <li className="my-1" style={inputStyle}>
        <DeviceButton videoRef={videoRef} />
      </li>
      <li className="my-1" style={inputStyle}>
        <GamesButton setGameId={setGameId} setColor={setColor} setText={setText} />
      </li>
      <li className="my-1" style={inputStyle}>
        <CornersButton piecesModelRef={piecesModelRef} xcornersModelRef={xcornersModelRef} videoRef={videoRef} canvasRef={canvasRef}
          setText={setText} />
      </li>
      <li className="my-1">
        <div className="btn-group w-100" role="group" aria-label="Move detection controls">
          <RecordButton playing={playing} setPlaying={setPlaying} />
        </div>
      </li>
    </Sidebar>
  );
};

export default PlaySidebar;
