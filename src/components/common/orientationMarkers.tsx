import type { CornerName, Roi, VideoRef } from "../../types";

export const MARKER_DIAMETER: number = 30;
// Region corners clockwise from the top left, as fractions of its width and height
const CORNER_XY: number[][] = [[0, 0], [1, 0], [1, 1], [0, 1]];

// The square names the model assumed at the corners of the region (the whole video without one)
const OrientationMarkers = ({ videoRef, roi, orientation }: {
  videoRef: VideoRef,
  roi: Roi | null,
  orientation: CornerName[] | null
}) => {
  const video = videoRef.current;
  if (orientation === null || video === null || video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }
  const rect: Roi = roi ?? { x: 0, y: 0, width: video.videoWidth, height: video.videoHeight };

  const markerStyle = (xy: number[]): React.CSSProperties => ({
    position: "absolute",
    left: `${100 * (rect.x + xy[0] * rect.width) / video.videoWidth}%`,
    top: `${100 * (rect.y + xy[1] * rect.height) / video.videoHeight}%`,
    width: MARKER_DIAMETER,
    height: MARKER_DIAMETER,
    // Inside the region, against its corner
    transform: `translate(${-100 * xy[0]}%, ${-100 * xy[1]}%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    // Set explicitly, as the dark theme's inherited text colour is light
    color: "#212529",
    userSelect: "none",
    pointerEvents: "none"
  });

  return (
    <>
      {orientation.map((name, i) =>
        <div key={name} style={markerStyle(CORNER_XY[i])}><strong>{name}</strong></div>
      )}
    </>
  );
};

export default OrientationMarkers;
