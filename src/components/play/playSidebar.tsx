import { Sidebar, SidebarSection, RecordButton, DeviceButton, RoiButton } from "../common";
import type {
  Camera, Game, Roi, SetBoolean, SetRoi, SetStringArray
} from "../../types";
import { useUser } from "../../slices/userSlice";
import { useEffect, useRef, useState } from "react";
import { describeLichessError, isTransientError, LichessError, lichessPlayMove, lichessStreamGame } from "../../api/lichess";
import { errorClear, errorShow } from "../../slices/errorSlice";
import type { BoardStreamEvent } from "../../api/lichess";
import type { Color } from "chessops/types";
import { gameUpdate, makeBoard, makeUpdatePayload, useGame, gameSetClock } from "../../slices/gameSlice";
import GamesButton from "./gamesButton";
import { GameBoard } from "../../chess/board";

const MOVE_RETRY_DELAY = 2000;

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
  // Bumped when the game is left, so a move being retried for it is dropped
  const sendGeneration = useRef<number>(0);
  const sentMove = useRef<string>("");
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
    // The game also changes with the clock, which must not send the move again
    const moveKey = `${gameId} ${game.moves}`;
    if (moveKey === sentMove.current) {
      return;
    }
    sentMove.current = moveKey;

    const describeMoveError = (error: unknown): string =>
      (error instanceof LichessError && error.status === 400)
        ? "This mode can't be played through the API. Try a Rapid or Classical."
        : `Unable to send your move to Lichess. ${describeLichessError(error)}`;

    // Retries until Lichess has the move, as the opponent cannot reply without it
    const sendMove = async () => {
      for (let attempt = 0; ; attempt++) {
        try {
          await lichessPlayMove(token, gameId, lastMove);
          errorClear("move");
          return;
        } catch (error) {
          if (sendGeneration.current !== generation) {
            return;
          }
          if (!isTransientError(error)) {
            console.error("Unable to send the move to Lichess", error);
            // A retry refused as a bad request most likely landed on an earlier attempt whose response was lost
            const landed: boolean = (attempt > 0) && (error instanceof LichessError) && (error.status === 400);
            if (landed) {
              errorClear("move");
            } else {
              errorShow({ source: "move", message: describeMoveError(error) });
            }
            return;
          }
          console.warn("Unable to send the move to Lichess, retrying", error);
          errorShow({ source: "move", message: `${describeMoveError(error)} Retrying...` });
          await new Promise((resolve) => setTimeout(resolve, MOVE_RETRY_DELAY));
          if (sendGeneration.current !== generation) {
            return;
          }
        }
      }
    };
    const generation: number = sendGeneration.current;
    void sendMove();
  }, [color, game, gameId, token])

  useEffect(() => {
    if (gameId === undefined) {
      return;
    }

    const onEvent = (response: BoardStreamEvent) => {
      // Chat and opponent-gone events don't change the board
      if (response.type !== "gameFull" && response.type !== "gameState") return;

      // gameFull nests the game state under `state`; gameState is the state itself.
      const { moves, wtime, btime, status } = response.type === "gameFull" ? response.state : response;

      const lichessMoves: string[] = (moves.trim() === "") ? [] : moves.trim().split(" ");
      gameSetClock({
        wtime,
        btime,
        turn: lichessMoves.length % 2 === 0 ? "w" : "b",
        updatedAt: Date.now(),
        running: status === "started",
      });

      // Moves Lichess has not seen yet are ours, still being sent
      if (lichessMoves.length <= makeBoard(gameRef.current).history.length) return;

      // Otherwise Lichess is the truth, so the whole game is replayed rather than just its last move,
      // which also catches up after a reconnect
      const board = new GameBoard(gameRef.current.start);
      for (const move of lichessMoves) {
        if (board.playUci(move) === null) {
          throw new Error(`Lichess sent ${move}, which is illegal here`);
        }
      }
      const payload = makeUpdatePayload(board, false, true);
      gameUpdate(payload);
      // Back in step with Lichess
      errorClear("stream");
    };

    const controller = lichessStreamGame(token, gameId, {
      onEvent,
      onConnect: () => errorClear("stream"),
      onDisconnect: (error, reconnecting) => {
        const next: string = reconnecting ? " Reconnecting..." : "";
        errorShow({ source: "stream", message: `Lost connection to the Lichess game. ${describeLichessError(error)}${next}` });
      },
      onEventError: () => errorShow({ source: "stream", message: "Unable to follow the Lichess game." })
    });
    return () => {
      controller.abort();
      // Also stops retrying a move for the game being left, and drops its errors, which no longer apply
      sendGeneration.current += 1;
      errorClear("stream");
      errorClear("move");
    };
  }, [gameId, token]);

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
