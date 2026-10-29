import { gameUpdate, makeUpdatePayload } from "../slices/gameSlice";
import type { GameBoard } from "../chess/board";
import { invalidVideo } from "./detect";
import { getOrientation, runChessqueries } from "./chessqueries";
import type {
  Mode, ModelRefs, MovesData, MovesPair, RoiRef, SetFps, SetOrientation, SetStringArray, VideoRef
} from "../types";
import { EMPTY, NUM_LABELS } from "../utils/constants";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";
import type { RefObject } from "react";
import type { Position } from "chessops/chess";

// Above 0.5, a class must be the most likely for its square, as the probabilities sum to 1
export const calculateScore = (state: number[][], move: MovesData, from_thr = 0.5, to_thr = 0.5) => {
  let score = 0;
  move.from.forEach(square => {
    score += state[square][EMPTY] - from_thr;
  })

  for (let i = 0; i < move.to.length; i++) {
    score += state[move.to[i]][move.targets[i]] - to_thr;
  }

  return score
}

export const processState = (state: number[][], movesPairs: MovesPair[], possibleMoves: Set<string>): {
  bestScore1: number, bestScore2: number, bestJointScore: number,
  bestMove: MovesData | null, bestMoves: MovesData | null
} => {
  let bestScore1 = Number.NEGATIVE_INFINITY;
  let bestScore2 = Number.NEGATIVE_INFINITY;
  let bestJointScore = Number.NEGATIVE_INFINITY;
  let bestMove: MovesData | null = null;
  let bestMoves: MovesData | null = null;
  const seen: Set<string> = new Set();

  movesPairs.forEach(movePair => {
    if (!seen.has(movePair.move1.sans[0])) {
      seen.add(movePair.move1.sans[0]);
      const score = calculateScore(state, movePair.move1);
      if (score > 0) {
        possibleMoves.add(movePair.move1.sans[0]);
      }
      if (score > bestScore1) {
        bestMove = movePair.move1;
        bestScore1 = score;
      }
    }

    if ((movePair.move2 === null) || (movePair.moves === null) || !(possibleMoves.has(movePair.move1.sans[0]))) {
      return;
    }

    const score2: number = calculateScore(state, movePair.move2);
    if (score2 < 0) {
      return;
    } else if (score2 > bestScore2) {
      bestScore2 = score2;
    }

    const jointScore: number = calculateScore(state, movePair.moves);
    if (jointScore > bestJointScore) {
      bestJointScore = jointScore;
      bestMoves = movePair.moves;
    }
  })

  return { bestScore1, bestScore2, bestJointScore, bestMove, bestMoves };
}

const updateState = (state: number[][], update: number[][], decay: number = 0.5) => {
  for (let i = 0; i < 64; i++) {
    for (let j = 0; j < NUM_LABELS; j++) {
      state[i][j] = decay * state[i][j] + (1 - decay) * update[i][j]
    }
  }
  return state
}

// How often the FPS shown updates, in ms
const FPS_INTERVAL = 1000;
// Detections per second of video, to spare the GPU and battery.
// Faster playback scales it, e.g. 16 FPS at 4x; the live camera plays at 1x.
const MAX_FPS = 4;

// Keeps the same array when the text is unchanged, so React skips re-rendering the page every frame
const setTextIfChanged = (setText: SetStringArray, text: string[]) => {
  setText((prev) => ((prev.length === text.length) && prev.every((t, i) => t === text[i])) ? prev : text);
}

// How long a single move must stay the best, without a break, before it is played, in ms
const GREEDY_TIME = 1000;

// The best single move, and since when it has been the best without a break
export class GreedyTimer {
  #move: string | null = null;
  #since: number = 0;

  reset() {
    this.#move = null;
  }

  // Whether the move has been the best for long enough. A null move (no good move this frame) is a break.
  update(move: string | null, now: number): boolean {
    if (move === null) {
      this.#move = null;
      return false;
    }
    // A different best move restarts the timer
    if (move !== this.#move) {
      this.#move = move;
      this.#since = now;
    }
    return (now - this.#since) > GREEDY_TIME;
  }
}

const sanToLan = (board: Position, san: string): string => {
  const move = parseSan(board, san);
  if (!move) return "";
  return makeUci(move);
}

interface FindPiecesInput {
  chessqueriesModelRef: ModelRefs["chessqueriesModelRef"],
  videoRef: VideoRef,
  roiRef: RoiRef,
  playingRef: RefObject<boolean>,
  setText: SetStringArray,
  setFps: SetFps,
  setOrientation: SetOrientation,
  boardRef: RefObject<GameBoard>,
  movesPairsRef: RefObject<MovesPair[]>,
  lastMoveRef: RefObject<string>,
  moveTextRef: RefObject<string>,
  mode: Mode
}

export const findPieces = ({ chessqueriesModelRef, videoRef, roiRef, playingRef, setText, setFps, setOrientation,
  boardRef, movesPairsRef, lastMoveRef, moveTextRef, mode }: FindPiecesInput) => {
  let state: number[][] | null = null;
  let direction: number[] | null = null;
  let orientationKey: string = "";
  let possibleMoves: Set<string>;
  let requestId: number;
  const greedy = new GreedyTimer();
  // Detections started since the FPS was last shown, which is about once a second so it's readable
  let fpsSince: number = 0;
  let fpsFrames: number = 0;
  let active = true;
  // When the next detection may start
  let nextRunTime: number = 0;
  // Whether the video has shown a frame that has not been detected yet. Browsers without
  // requestVideoFrameCallback cannot tell, so every frame counts as new.
  let frameVideo: HTMLVideoElement | null = null;
  let frameCallbackId: number | undefined;
  let newFrame: boolean = true;

  const watchFrames = (video: HTMLVideoElement | null) => {
    if (video === frameVideo) {
      return;
    }
    if (frameVideo !== null && frameCallbackId !== undefined) {
      frameVideo.cancelVideoFrameCallback(frameCallbackId);
    }
    frameVideo = video;
    frameCallbackId = undefined;
    newFrame = true;
    if (video === null || typeof video.requestVideoFrameCallback !== "function") {
      return;
    }
    const onFrame = () => {
      newFrame = true;
      frameCallbackId = video.requestVideoFrameCallback(onFrame);
    }
    frameCallbackId = video.requestVideoFrameCallback(onFrame);
  }

  const loop = async () => {
    try {
      watchFrames(videoRef.current);
      const now: number = performance.now();
      if (playingRef.current === false || invalidVideo(videoRef)) {
        if (state !== null) {
          setFps(null);
          fpsFrames = 0;
        }
        state = null
      } else if (newFrame && now >= nextRunTime) {
        newFrame = (frameCallbackId === undefined);
        const minFrameTime: number = 1000 / (MAX_FPS * (videoRef.current?.playbackRate || 1));
        // Steps by the interval, so the frames a display ticks on do not round the rate down,
        // but catches up by at most half an interval after a slow frame
        nextRunTime = Math.max(nextRunTime + minFrameTime, now + minFrameTime / 2);
        if (state === null) {
          possibleMoves = new Set<string>;
          greedy.reset();
        }
        const startTime: number = performance.now();
        // The real rate, from start to start, so it shows the cap and any time between detections
        if (fpsFrames === 0) {
          fpsSince = startTime;
        } else if ((startTime - fpsSince) >= FPS_INTERVAL) {
          setFps(1000 * fpsFrames / (startTime - fpsSince));
          fpsSince = startTime;
          fpsFrames = 0;
        }
        fpsFrames += 1;

        const { update, direction: newDirection } = await runChessqueries(chessqueriesModelRef, videoRef, roiRef.current);
        // A NaN would stay in the smoothed state for good, and no move scores above 0 against it.
        // The finally below still queues the next frame.
        if (!update.every((square) => square.every(Number.isFinite))) {
          console.warn("Skipped a frame with non-finite probabilities");
          return;
        }
        // The first frame starts the state, so detection does not wait for it to climb from zero
        state = (state === null) ? update : updateState(state, update);

        // Likewise for the smoothed direction
        if (newDirection?.every(Number.isFinite)) {
          // Smoothed like the state, so a board near 45 degrees does not flicker between orientations
          direction = (direction === null) ? newDirection
            : direction.map((d, i) => 0.5 * d + 0.5 * newDirection[i]);
          const orientation = getOrientation(direction);
          if (orientation.join() !== orientationKey) {
            orientationKey = orientation.join();
            setOrientation(orientation);
          }
        }
        const { bestScore1, bestScore2, bestJointScore, bestMove, bestMoves } = processState(state, movesPairsRef.current, possibleMoves);

        const endTime: number = performance.now();

        let hasMove: boolean = false;
        if ((bestMoves !== null) && (mode !== "play")) {
          const move: string = bestMoves.sans[0];
          hasMove = (bestScore2 > 0) && (bestJointScore > 0);
          if (hasMove) {
            boardRef.current.playSan(move);
            possibleMoves.clear();
            greedy.reset();
          }
        }

        let hasGreedyMove: boolean = false;
        const greedyMove: string | null = (bestMove === null || hasMove || (bestScore1 <= 0)) ? null : bestMove.sans[0];
        if (greedy.update(greedyMove, endTime) && greedyMove !== null) {
          hasGreedyMove = sanToLan(boardRef.current.position, greedyMove) !== lastMoveRef.current;
          if (hasGreedyMove) {
            boardRef.current.playSan(greedyMove);
            greedy.reset();
          }
        }

        if (hasMove || hasGreedyMove) {
          // No takebacks in "play" mode
          const greedy = (mode === "play") ? false : hasGreedyMove;
          const payload = makeUpdatePayload(boardRef.current, greedy);
          gameUpdate(payload);
        }
        setTextIfChanged(setText, [moveTextRef.current]);
      }
    } catch (error) {
      console.error("Piece detection failed", error);
      setTextIfChanged(setText, ["Piece detection failed", (error instanceof Error) ? error.message : String(error)]);
    } finally {
      if (active) {
        requestId = requestAnimationFrame(() => {
          void loop();
        });
      }
    }
  }
  requestId = requestAnimationFrame(() => {
    void loop();
  });

  return () => {
    active = false;
    if (requestId) {
      window.cancelAnimationFrame(requestId);
    }
    watchFrames(null);
  };
};
