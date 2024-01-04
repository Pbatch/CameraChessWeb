import { VideoButton, PlayButton, RestartButton, PlaybackButtons } from "./buttons";
import { CornersButton, HomeButton, Display, PgnButton, Sidebar, DigitalButton } from "../common";

const VideoSidebar = ({ videoRef, xcornersModelRef, piecesModelRef, canvasRef, sidebarRef, text, setText,
playing, setPlaying, digital, setDigital }) => {
  return (
    <Sidebar sidebarRef={sidebarRef}>
      <li className="my-1">
        <VideoButton videoRef={videoRef} canvasRef={canvasRef} setPlaying={setPlaying} />
      </li>
      <li className="my-1">
        <CornersButton piecesModelRef={piecesModelRef} xcornersModelRef={xcornersModelRef} 
        webcamRef={videoRef} canvasRef={canvasRef} setText={setText} />
      </li>
      <li className="my-1">
        <div className="btn-group w-100" role="group">
          <PlayButton videoRef={videoRef} playing={playing} setPlaying={setPlaying} />
          <RestartButton videoRef={videoRef} />
        </div>
      </li>
      <li className="my-1">
        <PlaybackButtons videoRef={videoRef} />
      </li>
      <li className="my-1">
        <DigitalButton digital={digital} setDigital={setDigital} />
      </li>
      <li className="border-top"></li>
      <li className="my-1">
        <Display text={text} />
      </li>
      <li className="border-top"></li>
      
      <li className="my-1">
        <div className="btn-group w-100" role="group">
          <PgnButton setText={setText} recording={playing} />
          <HomeButton />
        </div>
      </li>
    </Sidebar>
  );
};

export default VideoSidebar;