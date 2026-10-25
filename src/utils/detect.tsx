import type { VideoRef } from "../types";

export const invalidVideo = (videoRef: VideoRef) => {
  const video = videoRef.current;
  if (video === null) {
    return true;
  }

  if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
    return true;
  }

  if (video.autoplay) {
    // Record check
    if (video.srcObject === null) {
      return true;
    }
  } else {
    // Upload check
    const src = video.getAttribute("src");
    if (src === null) {
      return true;
    }

    if (!(src.startsWith("blob:"))) {
      return true;
    }
  }

  return false;
}
