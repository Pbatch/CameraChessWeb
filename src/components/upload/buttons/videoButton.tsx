import { useRef, useState } from "react";
import { clearCtx } from "../../../utils/render/common";
import { Icon, SidebarButton } from "../../common";
import { SetBoolean } from "../../../types";

const VideoButton = ({ videoRef, canvasRef, setPlaying }: {
  videoRef: any, canvasRef: any, setPlaying: SetBoolean
}) => {
  const inputVideoRef: any = useRef(null);
  const [streaming, setStreaming] = useState(false);

  const closeVideo = () => {
    const url = videoRef.current.currentSrc || videoRef.current.src;
    videoRef.current.pause();
    videoRef.current.removeAttribute("src");
    videoRef.current.load();
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }

    clearCtx(canvasRef.current.getContext('2d'));

    setStreaming(false);
    inputVideoRef.current.value = "";
    videoRef.current.style.display = "none";
  };

  const handleOnChange = (e: any) => {
    const file = e.target.files[0];
    if (file === undefined) {
      return;
    }

    const url = URL.createObjectURL(file);
    videoRef.current.src = url;
    videoRef.current.load();
    videoRef.current.style.display = "block";
    setStreaming(true);
  }

  const handleOnClick = () => {
    if (streaming === false) {
      inputVideoRef.current.click();
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
