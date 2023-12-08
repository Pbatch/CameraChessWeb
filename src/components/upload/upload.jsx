import { useRef, useState, useEffect } from "react";
import Video from "./video.jsx";
import VideoSidebar from "./videoSidebar.jsx";
import { useOutletContext } from "react-router-dom";

const Upload = () => {
  const [piecesModelRef, xcornersModelRef] = useOutletContext();

  const [text, setText] = useState([]);
  const [playing, setPlaying] = useState(false);
  
  const videoRef = useRef(null);
  const playingRef = useRef(playing);
  const canvasRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  return (
    <div className="d-flex bg-dark h-100">
      <VideoSidebar videoRef={videoRef} piecesModelRef={piecesModelRef} xcornersModelRef={xcornersModelRef} 
      canvasRef={canvasRef} setText={setText} sidebarRef={sidebarRef} playing={playing} setPlaying={setPlaying}
      text={text} />
      <Video modelRef={piecesModelRef} videoRef={videoRef} canvasRef={canvasRef} sidebarRef={sidebarRef} 
      playing={playing} playingRef={playingRef} setText={setText} />
    </div>
  );
};

export default Upload;
