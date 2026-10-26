import { useRef, useState } from "react";
import type { Roi, SetBoolean, SetRoi, VideoRef } from "../../types";

// Smallest side (in video pixels) accepted for a region
const MIN_ROI_SIZE: number = 32;

const RoiSelector = ({ videoRef, roi, setRoi, selecting, setSelecting }: {
  videoRef: VideoRef,
  roi: Roi | null,
  setRoi: SetRoi,
  selecting: boolean,
  setSelecting: SetBoolean
}) => {
  const startRef = useRef<number[] | null>(null);
  const [draft, setDraft] = useState<Roi | null>(null);

  // Pointer position in video pixels
  const toVideoXY = (e: React.PointerEvent<HTMLDivElement>): number[] | null => {
    const video = videoRef.current;
    if (video === null || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * video.videoWidth / rect.width;
    const y = (e.clientY - rect.top) * video.videoHeight / rect.height;
    return [
      Math.min(Math.max(x, 0), video.videoWidth),
      Math.min(Math.max(y, 0), video.videoHeight)
    ];
  }

  // Rectangle spanning the start point and the pointer (both already inside the video)
  const makeRect = (start: number[], end: number[]): Roi => {
    const x = Math.round(Math.min(start[0], end[0]));
    const y = Math.round(Math.min(start[1], end[1]));
    return {
      x,
      y,
      width: Math.round(Math.max(start[0], end[0])) - x,
      height: Math.round(Math.max(start[1], end[1])) - y
    };
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const xy = toVideoXY(e);
    if (xy === null) {
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = xy;
    setDraft(null);
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const xy = toVideoXY(e);
    if (startRef.current === null || xy === null) {
      return;
    }
    setDraft(makeRect(startRef.current, xy));
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const xy = toVideoXY(e);
    const start = startRef.current;
    startRef.current = null;
    setDraft(null);
    if (start === null || xy === null) {
      return;
    }
    const rect = makeRect(start, xy);
    if (rect.width >= MIN_ROI_SIZE && rect.height >= MIN_ROI_SIZE) {
      setRoi(rect);
      setSelecting(false);
    }
  }

  const video = videoRef.current;
  const shown: Roi | null = draft ?? (selecting ? null : roi);

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    // Keeps the region's shadow on the video
    overflow: "hidden",
    cursor: selecting ? "crosshair" : "default",
    pointerEvents: selecting ? "auto" : "none",
    touchAction: "none",
    backgroundColor: selecting ? "rgba(0, 0, 0, 0.2)" : "transparent"
  }

  const rectStyle = (rect: Roi, width: number, height: number): React.CSSProperties => ({
    position: "absolute",
    left: `${100 * rect.x / width}%`,
    top: `${100 * rect.y / height}%`,
    width: `${100 * rect.width / width}%`,
    height: `${100 * rect.height / height}%`,
    border: "2px solid white",
    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.4)"
  })

  return (
    <div style={overlayStyle} onPointerDown={onPointerDown} onPointerMove={onPointerMove}
      onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      {(shown !== null && video !== null && video.videoWidth > 0) &&
        <div style={rectStyle(shown, video.videoWidth, video.videoHeight)} />
      }
    </div>
  );
};

export default RoiSelector;
