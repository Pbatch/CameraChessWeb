import { gameUpdate, makeUpdatePayload } from "../slices/gameSlice";
import type { CameraChessBoard } from "../slices/gameSlice";
import { invalidVideo } from "./detect";
import { getAccelerator, getOrientation, runChessqueries } from "./chessqueries";
import type {
  Mode, ModelRefs, MovesData, MovesPair, RoiRef, SetOrientation, SetStringArray, VideoRef
} from "../types";
import { EMPTY, NUM_LABELS } from "../utils/constants";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";
import type { Dispatch, UnknownAction } from "@reduxjs/toolkit";
import type { RefObject } from "react";
import type { Position } from "chessops/chess";

// Above 0.5, a class must be the most likely for its square, as the probabilities sum to 1
const calculateScore = (state: number[][], move: MovesData, from_thr = 0.5, to_thr = 0.5) => {
  let score = 0;
  move.from.forEach(square => {
    score += state[square][EMPTY] - from_thr;
  })

  for (let i = 0; i < move.to.length; i++) {
    score += state[move.to[i]][move.targets[i]] - to_thr;
  }

  return score
}

const processState = (state: number[][], movesPairs: MovesPair[], possibleMoves: Set<string>): {
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
  setOrientation: SetOrientation,
  dispatch: Dispatch<UnknownAction>,
  boardRef: RefObject<CameraChessBoard>,
  movesPairsRef: RefObject<MovesPair[]>,
  lastMoveRef: RefObject<string>,
  moveTextRef: RefObject<string>,
  mode: Mode
}

export const findPieces = ({ chessqueriesModelRef, videoRef, roiRef, playingRef, setText, setOrientation,
  dispatch, boardRef, movesPairsRef, lastMoveRef, moveTextRef, mode }: FindPiecesInput) => {
  let state: number[][] | null = null;
  let direction: number[] | null = null;
  let orientationKey: string = "";
  let possibleMoves: Set<string>;
  let requestId: number;
  // The best single move, and since when it has been the best without a break
  let greedyMove: string | null = null;
  let greedySince: number = 0;
  let active = true;

  const loop = async () => {
    try {
      if (playingRef.current === false || invalidVideo(videoRef)) {
        state = null
      } else {
        if (state === null) {
          possibleMoves = new Set<string>;
          greedyMove = null;
        }
        const startTime: number = performance.now();

        const { update, direction: newDirection } = await runChessqueries(chessqueriesModelRef, videoRef, roiRef.current);
        // The first frame starts the state, so detection does not wait for it to climb from zero
        state = (state === null) ? update : updateState(state, update);

        if (newDirection !== null) {
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
        const fps: string = (1000 / (endTime - startTime)).toFixed(1);

        let hasMove: boolean = false;
        if ((bestMoves !== null) && (mode !== "play")) {
          const move: string = bestMoves.sans[0];
          hasMove = (bestScore2 > 0) && (bestJointScore > 0);
          if (hasMove) {
            boardRef.current.playSan(move);
            possibleMoves.clear();
            greedyMove = null;
          }
        }

        let hasGreedyMove: boolean = false;
        if (bestMove === null || hasMove || (bestScore1 <= 0)) {
          greedyMove = null;
        } else {
          const move: string = bestMove.sans[0];
          // A different best move, or a frame without one, restarts the second
          if (move !== greedyMove) {
            greedyMove = move;
            greedySince = endTime;
          }

          const secondElapsed = (endTime - greedySince) > 1000;
          const newMove = sanToLan(boardRef.current, move) !== lastMoveRef.current;
          hasGreedyMove = secondElapsed && newMove;
          if (hasGreedyMove) {
            boardRef.current.playSan(move);
            greedyMove = null;
          }
        }

        if (hasMove || hasGreedyMove) {
          // No takebacks in "play" mode
          const greedy = (mode === "play") ? false : hasGreedyMove;
          const payload = makeUpdatePayload(boardRef.current, greedy);
          dispatch(gameUpdate(payload));
        }
        const device: string = (getAccelerator() === "wasm") ? " (CPU)" : "";
        setText([`FPS: ${fps}${device}`, moveTextRef.current]);
      }
    } catch (error) {
      console.error("Piece detection failed", error);
      setText(["Piece detection failed", (error instanceof Error) ? error.message : String(error)]);
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
  };
};
