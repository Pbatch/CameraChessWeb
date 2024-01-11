import { VideoButton, PlayButton, RestartButton, PlaybackButtons, StopButton } from "./buttons";
import { CornersButton, HomeButton, Display, PgnButton, Sidebar, DigitalButton } from "../common";
import { setBoolean, setStringArray } from "../../types";
import FenButton from "../common/fenButton";

const UploadSidebar = ({ videoRef, xcornersModelRef, piecesModelRef, canvasRef, 
  sidebarRef, text, setText, playing, setPlaying, digital, setDigital, cornersRef }: {
  videoRef: any, xcornersModelRef: any, piecesModelRef: any, canvasRef: any, sidebarRef: any,
  text: string[], setText: setStringArray,
  playing: boolean, setPlaying: setBoolean,
  digital: boolean, setDigital: setBoolean,
  cornersRef: any
}) => {
  return (
    <Sidebar sidebarRef={sidebarRef}>
      <li className="my-1">
        <VideoButton videoRef={videoRef} canvasRef={canvasRef} setPlaying={setPlaying} />
      </li>
      <li className="my-1">
        <CornersButton piecesModelRef={piecesModelRef} xcornersModelRef={xcornersModelRef} 
        videoRef={videoRef} canvasRef={canvasRef} setText={setText} />
      </li>
      <li className="my-1">
        <FenButton piecesModelRef={piecesModelRef} videoRef={videoRef} 
        canvasRef={canvasRef} setText={setText} cornersRef={cornersRef} />
      </li>
      <li className="my-1">
        <div className="btn-group w-100" role="group">
          <PlayButton videoRef={videoRef} playing={playing} setPlaying={setPlaying} />
          <StopButton videoRef={videoRef} setPlaying={setPlaying} setText={setText} />
          <RestartButton videoRef={videoRef} setText={setText} />
        </div>
      </li>
      <li className="my-1">
        <PlaybackButtons videoRef={videoRef} />
      </li>
      <li className="border-top"></li>
      <li className="my-1">
        <Display text={text} />
      </li>
      <li className="border-top"></li>
      <li className="my-1">
        <div className="btn-group w-100" role="group">
          <DigitalButton digital={digital} setDigital={setDigital} />
          <PgnButton setText={setText} playing={playing} />
          <HomeButton />
        </div>
      </li>
    </Sidebar>
  );
};

export default UploadSidebar;