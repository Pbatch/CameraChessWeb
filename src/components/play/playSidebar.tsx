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
import { gameUpdate, gameSetError, makeBoard, makeUpdatePayload, useGame } from "../../slices/gameSlice";
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

    lichessPlayMove(token, gameId, lastMove)
      .catch((error: unknown) => {
        dispatch(gameSetError(error instanceof Error ? error.message : String(error)));
      });
  }, [color, dispatch, game, gameId, token])

  useEffect(() => {
    if (gameId === undefined) {
      return;
    }

    const streamGameCallback = async (response: BoardStreamEvent) => {
      // The selected game is already initialized from nowPlaying.fen.
      if (response.type === "gameFull") {
        return;
      }

      const moves = response.moves;
      if (moves === undefined) {
        return;
      }

      const splitMoves = moves.split(" ");
      const lastMove = splitMoves[splitMoves.length - 1];
      if (lastMove === gameRef.current.lastMove) {
        return;
      }

      const board = makeBoard(gameRef.current);
      board.playUci(lastMove);
      const payload = makeUpdatePayload(board, false, true);
      console.log("payload", payload);
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
