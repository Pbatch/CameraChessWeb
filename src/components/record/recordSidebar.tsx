import {
  Sidebar, SidebarSection, RecordButton, StopButton, FenButton, DeviceButton, RoiButton, ButtonGroup
} from "../common";
import type {
  Camera, ModelRefs, Roi, SetBoolean, SetRoi, SetStringArray, VideoRef
} from "../../types";

const RecordSidebar = ({ chessqueriesModelRef, videoRef, camera,
  playing, setPlaying, text, setText, roi, setRoi, selecting, setSelecting, canPlay }: {
  chessqueriesModelRef: ModelRefs["chessqueriesModelRef"],
  videoRef: VideoRef,
  camera: Camera,
  playing: boolean, setPlaying: SetBoolean, 
  text: string[], setText: SetStringArray,
  roi: Roi | null, setRoi: SetRoi,
  selecting: boolean, setSelecting: SetBoolean,
  canPlay: boolean
}) => {
  return (
    <Sidebar playing={playing} text={text} setText={setText} exportable={true} >
      <SidebarSection title="Setup" hidden={playing}>
        <DeviceButton camera={camera} />
        <RoiButton roi={roi} setRoi={setRoi} selecting={selecting} setSelecting={setSelecting}
          canPlay={canPlay} />
        <FenButton chessqueriesModelRef={chessqueriesModelRef} videoRef={videoRef} roi={roi} setText={setText}
          canPlay={canPlay} />
      </SidebarSection>
      <SidebarSection title="Detection">
        <ButtonGroup label="Move detection controls">
          <RecordButton playing={playing} setPlaying={setPlaying} />
          <StopButton setPlaying={setPlaying} setText={setText} />
        </ButtonGroup>
      </SidebarSection>
    </Sidebar>
  );
};

export default RecordSidebar;
