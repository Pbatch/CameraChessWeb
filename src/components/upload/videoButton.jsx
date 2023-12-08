import { useRef, useState } from "react";

const VideoButton = ({ videoRef }) => {
  const inputVideoRef = useRef(null);
  const [streaming, setStreaming] = useState(false);

  const closeVideo = () => {
    if (videoRef.current.src !== undefined) {
      const url = videoRef.current.src;
      videoRef.current.src = "";
      URL.revokeObjectURL(url);
    };

    setStreaming(false);
    inputVideoRef.current.value = "";
    videoRef.current.style.display = "none";
  };

  const handleOnChange = (e) => {
    const url = URL.createObjectURL(e.target.files[0]); 
    videoRef.current.src = url;
    videoRef.current.addEventListener("ended", () => closeVideo());
    videoRef.current.style.display = "block";
    setStreaming(true);
  }

  const handleOnClick = () => {
    if (streaming === false) {
      inputVideoRef.current.click();
    } else {
      closeVideo();
    }
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
      <button className="btn btn-dark btn-sm btn-outline-light w-100" onClick={handleOnClick}>
        {streaming ? "Close" : "Open"} Video
      </button>
    </>
  );
};

export default VideoButton;

