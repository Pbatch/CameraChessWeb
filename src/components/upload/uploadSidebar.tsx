import { useState } from "react";
import { VideoButton, PlayButton, RestartButton, PlaybackButtons, StopButton } from "./buttons";
import { CornersButton, Sidebar, FenButton } from "../common";
import type {
  CanvasRef, CornersRef, ModelRefs, SetBoolean, SetStringArray, SidebarRef, VideoRef
} from "../../types";

const UploadSidebar = ({ videoRef, xcornersModelRef, piecesModelRef, canvasRef, 
  sidebarRef, text, setText, playing, setPlaying, cornersRef }: {
  videoRef: VideoRef,
  xcornersModelRef: ModelRefs["xcornersModelRef"],
  piecesModelRef: ModelRefs["piecesModelRef"],
  canvasRef: CanvasRef,
  sidebarRef: SidebarRef,
  text: string[], setText: SetStringArray,
  playing: boolean, setPlaying: SetBoolean,
  cornersRef: CornersRef
}) => {
  const [videoSelected, setVideoSelected] = useState(false);

  const inputStyle = {
    display: playing ? "none": "inline-block"
  }

  return (
    <Sidebar sidebarRef={sidebarRef} playing={playing} text={text} setText={setText} >
      <li className="my-1" style={inputStyle}>
        <VideoButton
          videoRef={videoRef}
          canvasRef={canvasRef}
          setPlaying={setPlaying}
          videoSelected={videoSelected}
          setVideoSelected={setVideoSelected}
        />
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
        <PlaybackButtons videoRef={videoRef} videoSelected={videoSelected} />
      </li>
      <li className="my-1">
        <div className="btn-group w-100" role="group" aria-label="Video controls">
          <PlayButton videoRef={videoRef} playing={playing} setPlaying={setPlaying} videoSelected={videoSelected} />
          <StopButton videoRef={videoRef} setPlaying={setPlaying} setText={setText} videoSelected={videoSelected} />
          <RestartButton videoRef={videoRef} setText={setText} videoSelected={videoSelected} />
        </div>
      </li>
    </Sidebar>
  );
};

export default UploadSidebar;
