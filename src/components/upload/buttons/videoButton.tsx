import { useRef } from "react";
import { clearCtx } from "../../../utils/render/common";
import { Icon, SidebarButton } from "../../common";
import type { CanvasRef, SetBoolean, VideoRef } from "../../../types";

const VideoButton = ({ videoRef, canvasRef, setPlaying, videoSelected, setVideoSelected }: {
  videoRef: VideoRef,
  canvasRef: CanvasRef,
  setPlaying: SetBoolean,
  videoSelected: boolean,
  setVideoSelected: SetBoolean
}) => {
  const inputVideoRef = useRef<HTMLInputElement>(null);

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

    setVideoSelected(false);
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
    setVideoSelected(true);
  }

  const handleOnClick = () => {
    if (!videoSelected) {
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
      <SidebarButton
        onClick={handleOnClick}
        aria-label={videoSelected ? "Remove selected video" : "Choose a video"}
        title={videoSelected ? "Remove selected video" : "Choose a video"}
      >
        <Icon iconName={videoSelected ? "bi-folder-x" : "bi-folder"} />
      </SidebarButton>
    </>
  );
};

export default VideoButton;
