import { gameUpdate, makeUpdatePayload } from "../slices/gameSlice";
import type { CameraChessBoard } from "../slices/gameSlice";
import { invalidVideo } from "./detect";
import { getAccelerator, getOrientation, runChessqueries } from "./chessqueries";
import type {
  Mode, ModelRefs, MovesData, MovesPair, RoiRef, SetOrientation, SetStringArray, VideoRef
} from "../types";
import { zeros } from "./math";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";
import type { Dispatch, UnknownAction } from "@reduxjs/toolkit";
import type { RefObject } from "react";
import type { Position } from "chessops/chess";

const calculateScore = (state: number[][], move: MovesData, from_thr = 0.6, to_thr = 0.6) => {
  let score = 0;
  move.from.forEach(square => {
    score += 1 - Math.max(...state[square]) - from_thr;
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
    for (let j = 0; j < 12; j++) {
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

export const findPieces = (
  modelRef: ModelRefs["chessqueriesModelRef"],
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
) => {
  let state: number[][] | null = null;
  let direction: number[] | null = null;
  let orientationKey: string = "";
  let possibleMoves: Set<string>;
  let requestId: number;
  let greedyMoveToTime: { [move: string]: number };
  let active = true;

  const loop = async () => {
    try {
      if (playingRef.current === false || invalidVideo(videoRef)) {
        state = null
      } else {
        if (state === null) {
          state = zeros(64, 12);
          possibleMoves = new Set<string>;
          greedyMoveToTime = {};
        }
        const startTime: number = performance.now();

        const { update, direction: newDirection } = await runChessqueries(modelRef, videoRef, roiRef.current);
        state = updateState(state, update);

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
          hasMove = (bestScore2 > 0) && (bestJointScore > 0) && (possibleMoves.has(move));
          if (hasMove) {
            boardRef.current.playSan(move);
            possibleMoves.clear();
            greedyMoveToTime = {};
          }
        }

        let hasGreedyMove: boolean = false;
        if (bestMove !== null && !(hasMove) && (bestScore1 > 0)) {
          const move: string = bestMove.sans[0];
          if (!(move in greedyMoveToTime)) {
            greedyMoveToTime[move] = endTime;
          }

          const secondElapsed = (endTime - greedyMoveToTime[move]) > 1000;
          const newMove = sanToLan(boardRef.current, move) !== lastMoveRef.current;
          hasGreedyMove = secondElapsed && newMove;
          if (hasGreedyMove) {
            boardRef.current.playSan(move);
            greedyMoveToTime = { greedyMove: greedyMoveToTime[move] };
          }
        }

        if (hasMove || hasGreedyMove) {
          // No takebacks in "play" mode
          const greedy = (mode === "play") ? false : hasGreedyMove;
          const payload = makeUpdatePayload(boardRef.current, greedy);
          console.log("payload", payload);
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
