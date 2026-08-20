import { useRef, useState } from "react";
import { clearCtx } from "../../../utils/render/common";
import { Icon, SidebarButton } from "../../common";
import { CanvasRef, SetBoolean, VideoRef } from "../../../types";

const VideoButton = ({ videoRef, canvasRef, setPlaying }: {
  videoRef: VideoRef, canvasRef: CanvasRef, setPlaying: SetBoolean
}) => {
  const inputVideoRef = useRef<HTMLInputElement>(null);
  const [streaming, setStreaming] = useState(false);

  const closeVideo = () => {
    if (videoRef.current === null) return;

    const url = videoRef.current.currentSrc || videoRef.current.src;
    videoRef.current.pause();
    videoRef.current.removeAttribute("src");
    videoRef.current.load();
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }

    const context = canvasRef.current?.getContext('2d');
    if (context !== null && context !== undefined) {
      clearCtx(context);
    }

    setStreaming(false);
    if (inputVideoRef.current !== null) {
      inputVideoRef.current.value = "";
    }
    videoRef.current.style.display = "none";
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file === undefined) {
      return;
    }

    const url = URL.createObjectURL(file);
    if (videoRef.current === null) return;
    videoRef.current.src = url;
    videoRef.current.load();
    videoRef.current.style.display = "block";
    setStreaming(true);
  }

  const handleOnClick = () => {
    if (streaming === false) {
      inputVideoRef.current?.click();
    } else {
      closeVideo();
    }
    setPlaying(false);
  }

  return (
    <>
      <input
        type="file"
        accept="video/*"
        style={{ display: "none" }}
        onChange={handleOnChange}
        ref={inputVideoRef}
      />
      <SidebarButton onClick={handleOnClick}>
        <Icon iconName={streaming ? "bi-folder-x" : "bi-folder"} />
      </SidebarButton>
    </>
  );
};

export default VideoButton;
