import { gameUpdate, makeUpdatePayload } from "../slices/gameSlice";
import { invalidVideo } from "./detect";
import { getOrientation, runChessqueries } from "./chessqueries";
import { BeamTracker, PLAY_BEAM_OPTIONS, PLAY_TRACKER_OPTIONS } from "./beamTracker";
import { useStore } from "../store";
import type {
  Mode, ModelRefs, RoiRef, SetFps, SetOrientation, SetStringArray, VideoRef
} from "../types";
import type { RefObject } from "react";

// How often the FPS shown updates, in ms
const FPS_INTERVAL = 1000;
// Detections per second of video, to spare the GPU and battery.
// Faster playback scales it, e.g. 16 FPS at 4x; the live camera plays at 1x.
const MAX_FPS = 4;

// Keeps the same array when the text is unchanged, so React skips re-rendering the page every frame
const setTextIfChanged = (setText: SetStringArray, text: string[]) => {
  setText((prev) => ((prev.length === text.length) && prev.every((t, i) => t === text[i])) ? prev : text);
}

interface FindPiecesInput {
  chessqueriesModelRef: ModelRefs["chessqueriesModelRef"],
  videoRef: VideoRef,
  roiRef: RoiRef,
  playingRef: RefObject<boolean>,
  setText: SetStringArray,
  setFps: SetFps,
  setOrientation: SetOrientation,
  lastMoveRef: RefObject<string>,
  moveTextRef: RefObject<string>,
  mode: Mode
}

export const findPieces = ({ chessqueriesModelRef, videoRef, roiRef, playingRef, setText, setFps, setOrientation,
  lastMoveRef, moveTextRef, mode }: FindPiecesInput) => {
  // Follows several ways the game may have gone, so a move can still be corrected a few seconds on. Play mode sends
  // moves to Lichess as they are shown and can't take any back, so it shows only final moves.
  const tracker = (mode === "play") ? new BeamTracker(PLAY_TRACKER_OPTIONS, PLAY_BEAM_OPTIONS) : new BeamTracker();
  let direction: number[] | null = null;
  let orientationKey: string = "";
  let requestId: number;
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
  // A clock that stops while detection is paused, in ms. The tracker runs on it, so a pause neither counts as time
  // for its settings nor uses up the time a move can still be corrected in, and record mode times moves on it, from
  // where it was when detection last started on a game without moves.
  let playClock: number = 0;
  // Whether detection was running at the last frame, to clear the FPS shown when it stops
  let running: boolean = false;
  let lastTick: number | null = null;
  let recordStart: number = 0;

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
      if (playingRef.current === false) {
        lastTick = null;
        if (lastMoveRef.current === "") {
          recordStart = playClock;
        }
      } else {
        playClock += now - (lastTick ?? now);
        lastTick = now;
      }
      if (playingRef.current === false || invalidVideo(videoRef)) {
        // The tracker keeps its ways the game may have gone over a pause. It starts again only when the game is
        // changed other than by it.
        if (running) {
          setFps(null);
          fpsFrames = 0;
          running = false;
        }
      } else if (newFrame && now >= nextRunTime) {
        newFrame = (frameCallbackId === undefined);
        const minFrameTime: number = 1000 / (MAX_FPS * (videoRef.current?.playbackRate || 1));
        // Steps by the interval, so the frames a display ticks on do not round the rate down,
        // but catches up by at most half an interval after a slow frame
        nextRunTime = Math.max(nextRunTime + minFrameTime, now + minFrameTime / 2);
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
        running = true;
        const elapsed = (mode === "record") ? (playClock - recordStart) : undefined;
        const shown = tracker.update(update, playClock, useStore.getState().game);
        if (shown !== null) {
          // A corrected move is timed from when it was played, which may be a few seconds back
          const ago = shown.times.map((time) => (time === null) ? null : playClock - time);
          gameUpdate(makeUpdatePayload(shown.board), elapsed, ago);
        }

        // The first frame starts the smoothed direction, so it does not wait to climb from zero
        if (newDirection?.every(Number.isFinite)) {
          // Smoothed, so a board near 45 degrees does not flicker between orientations
          direction = (direction === null) ? newDirection
            : direction.map((d, i) => 0.5 * d + 0.5 * newDirection[i]);
          const orientation = getOrientation(direction);
          if (orientation.join() !== orientationKey) {
            orientationKey = orientation.join();
            setOrientation(orientation);
          }
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
