import { getAccelerator } from "../../vision/chessqueries";

// Detection speed over the video's top-right corner, clear of a corner marker when one is there
const FpsDisplay = ({ fps, offset }: { fps: number | null, offset: number }) => {
  if (fps === null) {
    return null;
  }

  const device: string = (getAccelerator() === "wasm") ? " · CPU" : "";
  return (
    <div className="video-fps" style={{ right: offset }}>{fps.toFixed(1)} FPS{device}</div>
  )
}

export default FpsDisplay;
