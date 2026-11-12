export { START_FEN } from "@chesscam/recorder";

export const MEDIA_ASPECT_RATIO: number = 16 / 9;
type ExtendedMediaTrackConstraints = MediaTrackConstraints & {
  resizeMode?: ConstrainDOMString;
};

export const MEDIA_CONSTRAINTS: { audio: false, video: ExtendedMediaTrackConstraints } = {
  audio: false,
  video: {
    facingMode: {
      ideal: "environment"
    },
    width: {
      ideal: 1280
    },
    // Without resizing, this only picks the closest native mode, so the stream can still be 4:3 or portrait
    aspectRatio: MEDIA_ASPECT_RATIO,
    // Native frames only: no browser crop or upscale
    resizeMode: "none"
  }
}
