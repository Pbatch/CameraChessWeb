import i18n from "../i18n";
import { type Color, type PositionProblem, readPosition, videoReady } from "@chesscam/recorder";
import { gameReset } from "../slices/gameSlice";
import type { ModelRefs, Roi, SetStringArray, VideoRef } from "../types";

interface FindFenInput {
  modelRef: ModelRefs["modelRef"],
  videoRef: VideoRef,
  roi: Roi | null,
  setText: SetStringArray,
  color: Color
}

const SETUP_ERRORS = {
  "empty": "position.errors.empty",
  "kings": "position.errors.kings",
  "opposite-check": "position.errors.oppositeCheck",
  "pawns-on-backrank": "position.errors.pawnsOnBackrank"
} as const satisfies Record<PositionProblem, string>;

// Reads the position on the board and starts a new game from it, with `color` to move
export const findFen = async ({ modelRef, videoRef, roi, setText, color }: FindFenInput) => {
  const model = modelRef.current;
  const video = videoRef.current;
  if (model === null || !videoReady(video)) {
    return;
  }
  const result = await readPosition(model, video, roi, color);
  if (!result.ok) {
    setText([i18n.t("position.invalid"), i18n.t(SETUP_ERRORS[result.problem])]);
    return;
  }
  gameReset(result.fen);
  setText([i18n.t("position.set")]);
}
