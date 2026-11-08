import { useTranslation } from "react-i18next";
import { getAccelerator } from "../../vision/chessqueries";

// Detection speed over the video's top-right corner, clear of a corner marker when one is there
const FpsDisplay = ({ fps, offset }: { fps: number | null, offset: number }) => {
  const { t } = useTranslation();
  if (fps === null) {
    return null;
  }

  return (
    <div className="video-fps" style={{ right: offset }}>{t((getAccelerator() === "wasm") ? "camera.fpsCpu" : "camera.fps", { fps: fps.toFixed(1) })}</div>
  )
}

export default FpsDisplay;
