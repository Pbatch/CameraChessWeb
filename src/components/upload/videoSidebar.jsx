import { VideoButton, PlayButton, RestartButton, PlaybackButtons } from "./buttons";
import { CornersButton, HomeButton, Display, PgnButton, Sidebar, DigitalButton } from "../common";

const VideoSidebar = ({ videoRef, xcornersModelRef, piecesModelRef, canvasRef, sidebarRef, text, setText,
playing, setPlaying, digital, setDigital }) => {
  return (
    <Sidebar sidebarRef={sidebarRef}>
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
        <PgnButton setText={setText} recording={playing} />
      </li>
      <li className="my-1">
        <HomeButton />
      </li>
    </Sidebar>
  );
};

export default VideoSidebar;