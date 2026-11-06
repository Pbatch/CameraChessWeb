import { LichessAccount, Sidebar, SidebarSection, StudyButton, DeviceButton, RoiButton } from "../common";
import type {
  Camera, Roi, SetBoolean, SetNumber, SetRoi, SetStringArray, SetStudy, Study
} from "../../types";
import BoardNumberButton from "./boardNumberButton";

// Broadcasting is controlled from the bar over the camera (cameraControls.tsx)
const BroadcastSidebar = ({ camera,
  playing, text, setText, study, setStudy, boardNumber, setBoardNumber,
  roi, setRoi, selecting, setSelecting, canPlay }: {
  camera: Camera,
  playing: boolean,
  text: string[], setText: SetStringArray,
  study: Study | null, setStudy: SetStudy,
  boardNumber: number, setBoardNumber: SetNumber,
  roi: Roi | null, setRoi: SetRoi,
  selecting: boolean, setSelecting: SetBoolean,
  canPlay: boolean
}) => {
  return (
    // The board always shows, so pausing to check the game moves nothing
    <Sidebar playing={playing} text={text} setText={setText} setupFirst={true} showBoard={true}>
      {/* Stays while broadcasting, disabled, except on landscape phones, which need the room */}
      <SidebarSection title="Setup" className={playing ? "sidebar-section--hidden-short" : ""}>
        <LichessAccount disabled={playing} />
        <DeviceButton camera={camera} disabled={playing} />
        <RoiButton roi={roi} setRoi={setRoi} selecting={selecting} setSelecting={setSelecting}
          canPlay={canPlay && !playing} />
        <StudyButton study={study} setStudy={setStudy} onlyBroadcasts={true} disabled={playing} />
        <BoardNumberButton boardNumber={boardNumber} setBoardNumber={setBoardNumber} disabled={playing} />
      </SidebarSection>
    </Sidebar>
  );
};

export default BroadcastSidebar;
