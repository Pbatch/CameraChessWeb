import { Sidebar, SidebarSection, RecordButton, DeviceButton, RoiButton } from "../common";
import type {
  Camera, Game, Roi, SetBoolean, SetRoi, SetStringArray
} from "../../types";
import { useUser } from "../../slices/userSlice";
import { useEffect, useRef, useState } from "react";
import { lichessPlayMove, lichessStreamGame } from "../../api/lichess";
import type { BoardStreamEvent } from "../../api/lichess";
import type { Color } from "chessops/types";
import { useDispatch } from "react-redux";
import { gameUpdate, gameSetError, makeBoard, makeUpdatePayload, useGame, gameSetClock } from "../../slices/gameSlice";
import GamesButton from "./gamesButton";

const PlaySidebar = ({ camera,
  playing, setPlaying, text, setText, roi, setRoi, selecting, setSelecting, canPlay }: {
    camera: Camera,
    playing: boolean, setPlaying: SetBoolean,
    text: string[], setText: SetStringArray,
    roi: Roi | null, setRoi: SetRoi,
    selecting: boolean, setSelecting: SetBoolean,
    canPlay: boolean
  }) => {
  const token: string = useUser().token;
  const game: Game = useGame();
  const gameRef = useRef<Game>(game);
  const [gameId, setGameId] = useState<string>();
  const [color, setColor] = useState<Color>();
  const dispatch = useDispatch();
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
      // Chat and opponent-gone events don't change the board
      if (response.type !== "gameFull" && response.type !== "gameState") return;

      // gameFull nests the game state under `state`; gameState is the state itself.
      const { moves, wtime, btime, status } = response.type === "gameFull" ? response.state : response;

      const moveCount = moves.trim() === "" ? 0 : moves.trim().split(" ").length;
      dispatch(gameSetClock({
        wtime,
        btime,
        turn: moveCount % 2 === 0 ? "w" : "b",
        updatedAt: Date.now(),
        running: status === "started",
      }));

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
    <Sidebar playing={playing} text={text} setText={setText} >
      <SidebarSection title="Setup" hidden={playing}>
        <DeviceButton camera={camera} />
        <RoiButton roi={roi} setRoi={setRoi} selecting={selecting} setSelecting={setSelecting}
          canPlay={canPlay} />
        <GamesButton setGameId={setGameId} setColor={setColor} setText={setText} />
      </SidebarSection>
      <SidebarSection title="Detection">
        <div className="btn-group w-100" role="group" aria-label="Move detection controls">
          <RecordButton playing={playing} setPlaying={setPlaying} />
        </div>
      </SidebarSection>
    </Sidebar>
  );
};

export default PlaySidebar;
