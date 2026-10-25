import { Sidebar, RecordButton, StopButton, StudyButton, DeviceButton, RoiButton } from "../common";
import type {
  Roi, SetBoolean, SetNumber, SetRoi, SetStringArray, SetStudy, SidebarRef, Study, VideoRef
} from "../../types";
import BoardNumberInput from "./boardNumberInput";

const BroadcastSidebar = ({ videoRef, sidebarRef, 
  playing, setPlaying, text, setText, study, setStudy, setBoardNumber,
  roi, setRoi, selecting, setSelecting, canPlay }: {
  videoRef: VideoRef,
  sidebarRef: SidebarRef,
  playing: boolean, setPlaying: SetBoolean, 
  text: string[], setText: SetStringArray,
  study: Study | null, setStudy: SetStudy,
  setBoardNumber: SetNumber,
  roi: Roi | null, setRoi: SetRoi,
  selecting: boolean, setSelecting: SetBoolean,
  canPlay: boolean
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
        <RoiButton roi={roi} setRoi={setRoi} selecting={selecting} setSelecting={setSelecting}
          canPlay={canPlay} />
      </li>
      <li className="my-1" style={inputStyle}>
        <StudyButton study={study} setStudy={setStudy} onlyBroadcasts={true} />
      </li>
      <li className="my-1" style={inputStyle}>
        <BoardNumberInput setBoardNumber={setBoardNumber} />
      </li>
      <li className="my-1">
        <div className="btn-group w-100" role="group" aria-label="Move detection controls">
          <RecordButton playing={playing} setPlaying={setPlaying} />
          <StopButton setPlaying={setPlaying} setText={setText} />
        </div>
      </li>
    </Sidebar>
  );
};

export default BroadcastSidebar;
