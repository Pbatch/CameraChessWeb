import { LichessAccount, Sidebar, SidebarSection, DeviceButton, RoiButton } from "../common";
import type {
  Camera, Game, Roi, SetBoolean, SetRoi, SetStringArray
} from "../../types";
import { useUser } from "../../slices/userSlice";
import { useEffect, useRef, useState } from "react";
import { describeLichessError, isTransientError, LichessError, lichessPlayMove, lichessStreamGame } from "../../api/lichess";
import { errorClear, errorShow } from "../../slices/errorSlice";
import type { BoardStreamEvent } from "../../api/lichess";
import type { Color } from "chessops/types";
import { gameSync, useGame } from "../../slices/gameSlice";
import { clockSet } from "../../slices/clockSlice";
import GamesButton from "./gamesButton";
import { START_FEN } from "../../utils/constants";

const MOVE_RETRY_DELAY = 2000;

const PlaySidebar = ({ camera,
  playing, text, setText, roi, setRoi, selecting, setSelecting, canPlay }: {
    camera: Camera,
    playing: boolean,
    text: string[], setText: SetStringArray,
    roi: Roi | null, setRoi: SetRoi,
    selecting: boolean, setSelecting: SetBoolean,
    canPlay: boolean
  }) => {
  const token: string = useUser().token;
  const game: Game = useGame();
  const [gameId, setGameId] = useState<string>();
  const [color, setColor] = useState<Color>();
  // Bumped when the game is left, so a move being retried for it is dropped
  const sendGeneration = useRef<number>(0);
  const sentMove = useRef<string>("");

  useEffect(() => {
    const lastMove = game.lastMove;
    if ((lastMove === "") || (gameId === undefined) || (color === undefined) || game.fromOpponent) {
      return;
    }
    // Only our own moves are sent, so the last one is ours when it is the opponent's turn
    const colorToMove = game.fen.split(" ")[1];
    if (colorToMove === color.charAt(0)) {
      return;
    }
    // The effect can run again for the same move, which must not send it twice
    const moveKey = `${gameId} ${game.moves}`;
    if (moveKey === sentMove.current) {
      return;
    }
    sentMove.current = moveKey;

    // Lichess refuses a move with a 400, which most often means the board does not match its game
    const describeMoveError = (error: unknown): string =>
      (error instanceof LichessError && error.status === 400)
        ? `Lichess refused ${lastMove}${error.reason ? ` (${error.reason})` : ""}. Check the board matches the game on Lichess.`
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

    // From the gameFull that opens every stream, which gameState events follow
    let start: string | undefined;

    const onEvent = (response: BoardStreamEvent) => {
      // Chat and opponent-gone events don't change the board
      if (response.type !== "gameFull" && response.type !== "gameState") return;

      if (response.type === "gameFull") {
        start = (response.initialFen === "startpos") ? START_FEN : response.initialFen;
      }
      // gameFull nests the game state under `state`; gameState is the state itself.
      const { moves, wtime, btime, status } = response.type === "gameFull" ? response.state : response;

      const lichessMoves: string[] = (moves.trim() === "") ? [] : moves.trim().split(" ");
      clockSet({
        wtime,
        btime,
        turn: lichessMoves.length % 2 === 0 ? "w" : "b",
        updatedAt: Date.now(),
        running: status === "started",
      });

      if (start === undefined) {
        throw new Error("Lichess sent a move before the game");
      }
      // The whole game is replayed rather than just its last move, which also catches up after a reconnect
      gameSync(start, lichessMoves);
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
      // Also stops retrying a move for the game being left, and drops its clock and errors, which no longer apply
      sendGeneration.current += 1;
      clockSet(null);
      errorClear("stream");
      errorClear("move");
    };
  }, [gameId, token]);

  return (
    // The board and clock always show, so pausing detection moves nothing. Detection is controlled from the bar
    // over the camera (cameraControls.tsx).
    <Sidebar playing={playing} text={text} setText={setText} setupFirst={true} showBoard={true}>
      {/* Stays while detecting, disabled, except on landscape phones, which need the room */}
      <SidebarSection title="Setup" className={playing ? "sidebar-section--hidden-short" : ""}>
        <LichessAccount disabled={playing} />
        <DeviceButton camera={camera} disabled={playing} />
        <RoiButton roi={roi} setRoi={setRoi} selecting={selecting} setSelecting={setSelecting}
          canPlay={canPlay && !playing} />
        <GamesButton setGameId={setGameId} setColor={setColor} setText={setText} disabled={playing} />
      </SidebarSection>
    </Sidebar>
  );
};

export default PlaySidebar;
