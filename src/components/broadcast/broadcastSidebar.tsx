import { CornersButton, Sidebar, RecordButton, StopButton, StudyButton, DeviceButton } from "../common";
import type {
  CanvasRef, ModelRefs, SetBoolean, SetNumber, SetStringArray, SetStudy, SidebarRef, Study, VideoRef
} from "../../types";
import BoardNumberInput from "./boardNumberInput";

const BroadcastSidebar = ({ piecesModelRef, xcornersModelRef, videoRef, canvasRef, sidebarRef, 
  playing, setPlaying, text, setText, study, setStudy, setBoardNumber }: {
  piecesModelRef: ModelRefs["piecesModelRef"],
  xcornersModelRef: ModelRefs["xcornersModelRef"],
  videoRef: VideoRef,
  canvasRef: CanvasRef,
  sidebarRef: SidebarRef,
  playing: boolean, setPlaying: SetBoolean, 
  text: string[], setText: SetStringArray,
  study: Study | null, setStudy: SetStudy,
  setBoardNumber: SetNumber
}) => {
  const inputStyle = {
    display: playing ? "none": "inline-block"
  }
  return (
    <Sidebar sidebarRef={sidebarRef} playing={playing} text={text} setText={setText} >
      <li className="my-1" style={inputStyle}>
        <DeviceButton videoRef={videoRef} />
      </li>
      <li className="my-1" style={inputStyle}>
        <StudyButton study={study} setStudy={setStudy} onlyBroadcasts={true} />
      </li>
      <li className="my-1" style={inputStyle}>
        <BoardNumberInput setBoardNumber={setBoardNumber} />
      </li>
      <li className="my-1" style={inputStyle}>
        <CornersButton piecesModelRef={piecesModelRef} xcornersModelRef={xcornersModelRef} videoRef={videoRef} canvasRef={canvasRef} 
        setText={setText} />
      </li>
      <li className="my-1">
        <div className="btn-group w-100" role="group">
          <RecordButton playing={playing} setPlaying={setPlaying} />
          <StopButton setPlaying={setPlaying} setText={setText} />
        </div>
      </li>
    </Sidebar>
  );
};

export default BroadcastSidebar;
