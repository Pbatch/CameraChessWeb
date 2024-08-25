import { VideoButton, PlayButton, RestartButton, PlaybackButtons, StopButton } from "./buttons";
import { CornersButton, HomeButton, Display, PgnButton, Sidebar, FenButton } from "../common";
import { SetBoolean, SetStringArray } from "../../types";

const UploadSidebar = ({ videoRef, xcornersModelRef, piecesModelRef, canvasRef, 
  sidebarRef, text, setText, playing, setPlaying, cornersRef }: {
  videoRef: any, xcornersModelRef: any, piecesModelRef: any, canvasRef: any, sidebarRef: any,
  text: string[], setText: SetStringArray,
  playing: boolean, setPlaying: SetBoolean,
  cornersRef: any
}) => {

  const inputStyle = {
    display: playing ? "none": "inline-block"
  }

  return (
    <Sidebar sidebarRef={sidebarRef} playing={playing}>
      <li className="my-1" style={inputStyle}>
        <VideoButton videoRef={videoRef} canvasRef={canvasRef} setPlaying={setPlaying} />
      </li>
      <li className="my-1" style={inputStyle}>
        <CornersButton piecesModelRef={piecesModelRef} xcornersModelRef={xcornersModelRef} 
        videoRef={videoRef} canvasRef={canvasRef} setText={setText} />
      </li>
      <li className="my-1" style={inputStyle}>
        <FenButton piecesModelRef={piecesModelRef} videoRef={videoRef} 
        canvasRef={canvasRef} setText={setText} cornersRef={cornersRef} />
      </li>
      <li className="my-1" style={inputStyle}>
        <PlaybackButtons videoRef={videoRef} />
      </li>
      <li className="my-1">
        <div className="btn-group w-100" role="group">
          <PlayButton videoRef={videoRef} playing={playing} setPlaying={setPlaying} />
          <StopButton videoRef={videoRef} setPlaying={setPlaying} setText={setText} />
          <RestartButton videoRef={videoRef} setText={setText} />
        </div>
      </li>
      <li className="border-top"></li>
      <li className="my-1">
        <Display text={text} />
      </li>
      <li className="border-top"></li>
      <li className="my-1">
        <div className="btn-group w-100" role="group">
          <PgnButton setText={setText} playing={playing} />
          <HomeButton />
        </div>
      </li>
    </Sidebar>
  );
};

export default UploadSidebar;