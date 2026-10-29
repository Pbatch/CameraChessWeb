import { useRef, useState } from "react";
import { Icon, SidebarButton } from "../../common";
import type { SetBoolean, VideoRef } from "../../../types";

const VideoButton = ({ videoRef, setPlaying, videoSelected, setVideoSelected }: {
  videoRef: VideoRef,
  setPlaying: SetBoolean,
  videoSelected: boolean,
  setVideoSelected: SetBoolean
}) => {
  const inputVideoRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");

  const closeVideo = () => {
    if (videoRef.current === null) return;

    const url = videoRef.current.currentSrc || videoRef.current.src;
    videoRef.current.pause();
    videoRef.current.removeAttribute("src");
    videoRef.current.load();
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }

    setVideoSelected(false);
    setFileName("");
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
    setFileName(file.name);
  }

  const handleOnClick = () => {
    if (!videoSelected) {
      inputVideoRef.current?.click();
    } else {
      closeVideo();
    }
    setPlaying(false);
  }

  const label = videoSelected ? `Video: ${fileName}` : "Choose Video";
  const title = videoSelected ? `Remove video: ${fileName}` : "Choose video";

  return (
    <>
      <input
        type="file"
        accept="video/*"
        hidden
        onChange={handleOnChange}
        ref={inputVideoRef}
      />
      <SidebarButton
        onClick={handleOnClick}
        className="d-flex align-items-center justify-content-center"
        aria-label={title}
        title={title}
      >
        <Icon iconName={videoSelected ? "bi-folder-x" : "bi-folder"} className="me-2" />
        <span className="text-truncate">{label}</span>
      </SidebarButton>
    </>
  );
};

export default VideoButton;
