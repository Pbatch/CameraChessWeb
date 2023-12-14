import VideoButton from "./videoButton";
import CornersButton from "../common/cornersButton";
import HomeButton from "../common/homeButton";
import PlayButton from "./playButton";
import Display from "../common/display";
import RestartButton from "./restartButton";
import PgnButton from "../common/pgnButton";

const VideoSidebar = ({ videoRef, xcornersModelRef, piecesModelRef, canvasRef, sidebarRef, text, setText,
playing, setPlaying }) => {
  return (
    <div ref={sidebarRef} className="d-flex flex-column text-center px-1" style={{"width": "150px"}}>
      <ul className="nav nav-pills flex-column">
        <li className="my-1">
          <CornersButton piecesModelRef={piecesModelRef} xcornersModelRef={xcornersModelRef} 
          webcamRef={videoRef} canvasRef={canvasRef} setText={setText} />
        </li>
        <li className="my-1">
          <VideoButton videoRef={videoRef} canvasRef={canvasRef} setPlaying={setPlaying} />
        </li>
        <li className="my-1">
          <PlayButton videoRef={videoRef} playing={playing} setPlaying={setPlaying} />
        </li>
        <li className="my-1">
          <RestartButton videoRef={videoRef} />
        </li>
        <li className="border-top"></li>
        <li className="my-1">
          <Display text={text} />
        </li>
        <li className="border-top"></li>
        <li className="my-1">
          <PgnButton setText={setText} recording={playing} />
        </li>
        <li className="my-1">
          <HomeButton />
        </li>
      </ul>
    </div>
  );
};

export default VideoSidebar;