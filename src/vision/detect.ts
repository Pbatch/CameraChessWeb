import type { VideoRef } from "../types";

export const invalidVideo = (videoRef: VideoRef) => {
  const video = videoRef.current;
  // A frame mid-seek may be from before it, or half-decoded
  if (video === null || video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2 || video.seeking) {
    return true;
  }

  // Camera modes stream into srcObject, uploads play a blob URL
  const hasSource: boolean = (video.srcObject !== null) || (video.getAttribute("src")?.startsWith("blob:") ?? false);
  return !hasSource;
}
