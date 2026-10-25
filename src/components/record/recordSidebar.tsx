import { Sidebar, RecordButton, StopButton, FenButton, DeviceButton, RoiButton } from "../common";
import type {
  ModelRefs, Roi, SetBoolean, SetRoi, SetStringArray, SidebarRef, VideoRef
} from "../../types";

const RecordSidebar = ({ chessqueriesModelRef, videoRef, sidebarRef,
  playing, setPlaying, text, setText, roi, setRoi, selecting, setSelecting, canPlay }: {
  chessqueriesModelRef: ModelRefs["chessqueriesModelRef"],
  videoRef: VideoRef,
  sidebarRef: SidebarRef,
  playing: boolean, setPlaying: SetBoolean, 
  text: string[], setText: SetStringArray,
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
        <FenButton chessqueriesModelRef={chessqueriesModelRef} videoRef={videoRef} roi={roi} setText={setText} />
      </li>
      <li className="my-1" style={inputStyle}>
        <RoiButton roi={roi} setRoi={setRoi} selecting={selecting} setSelecting={setSelecting}
          canPlay={canPlay} />
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

export default RecordSidebar;
