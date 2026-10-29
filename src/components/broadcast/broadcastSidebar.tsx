import { Sidebar, SidebarSection, RecordButton, StopButton, StudyButton, DeviceButton, RoiButton } from "../common";
import type {
  Camera, Roi, SetBoolean, SetNumber, SetRoi, SetStringArray, SetStudy, Study
} from "../../types";
import BoardNumberInput from "./boardNumberInput";

const BroadcastSidebar = ({ camera,
  playing, setPlaying, text, setText, study, setStudy, setBoardNumber,
  roi, setRoi, selecting, setSelecting, canPlay }: {
  camera: Camera,
  playing: boolean, setPlaying: SetBoolean, 
  text: string[], setText: SetStringArray,
  study: Study | null, setStudy: SetStudy,
  setBoardNumber: SetNumber,
  roi: Roi | null, setRoi: SetRoi,
  selecting: boolean, setSelecting: SetBoolean,
  canPlay: boolean
}) => {
  return (
    <Sidebar playing={playing} text={text} setText={setText} >
      <SidebarSection title="Setup" hidden={playing}>
        <DeviceButton camera={camera} />
        <RoiButton roi={roi} setRoi={setRoi} selecting={selecting} setSelecting={setSelecting}
          canPlay={canPlay} />
        <StudyButton study={study} setStudy={setStudy} onlyBroadcasts={true} />
        <BoardNumberInput setBoardNumber={setBoardNumber} />
      </SidebarSection>
      <SidebarSection title="Detection">
        <div className="btn-group w-100" role="group" aria-label="Move detection controls">
          <RecordButton playing={playing} setPlaying={setPlaying} />
          <StopButton setPlaying={setPlaying} setText={setText} />
        </div>
      </SidebarSection>
    </Sidebar>
  );
};

export default BroadcastSidebar;
