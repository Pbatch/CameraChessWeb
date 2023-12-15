import { useRef, useState } from "react";
import { clearCtx } from "../../../utils/render/common";
import { Icon, SidebarButton } from "../../common";

const VideoButton = ({ videoRef, canvasRef, setPlaying }) => {
  const inputVideoRef = useRef(null);
  const [streaming, setStreaming] = useState(false);

  const closeVideo = () => {
    if (videoRef.current.src !== undefined) {
      const url = videoRef.current.src;
      videoRef.current.src = "";
      URL.revokeObjectURL(url);
    };

    clearCtx(canvasRef.current.getContext('2d'));

    setStreaming(false);
    inputVideoRef.current.value = "";
    videoRef.current.style.display = "none";
  };

  const handleOnChange = (e) => {
    const url = URL.createObjectURL(e.target.files[0]); 
    videoRef.current.src = url;
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

