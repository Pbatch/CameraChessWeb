import VideoButton from "./videoButton";
import CornersButton from "../common/cornersButton";
import HomeButton from "../common/homeButton";
import PlayButton from "./playButton";
import Display from "../common/display";
import RestartButton from "./restartButton";

const VideoSidebar = ({ videoRef, xcornersModelRef, piecesModelRef, canvasRef, sidebarRef, text, setText,
playing, setPlaying }) => {
  return (
    <div ref={sidebarRef} className="d-flex flex-column text-center px-1" style={{"width": "150px"}}>
      <div className="navbar-brand text-light h1 my-2">
        ChessCam
      </div>
      <ul className="nav nav-pills flex-column">
        <li className="border-top"></li>
        <li className="my-2">
          <VideoButton videoRef={videoRef} />
        </li>
        <li className="border-top"></li>
        <li className="my-2">
          {
            (videoRef.current?.src !== "") &&
            <CornersButton piecesModelRef={piecesModelRef} xcornersModelRef={xcornersModelRef} 
            webcamRef={videoRef} canvasRef={canvasRef} setText={setText} />
          }
        </li>
        <li className="my-2">
          <PlayButton playing={playing} setPlaying={setPlaying} />
        </li>
        <li className="my-2">
          <RestartButton videoRef={videoRef} />
        </li>
        <li className="border-top"></li>
        <li className="my-2">
          <Display text={text} />
        </li>
        <li className="border-top"></li>
        <li className="my-2">
          <HomeButton />
        </li>
      </ul>
    </div>
  );
};

export default VideoSidebar;