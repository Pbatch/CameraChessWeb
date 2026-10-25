import { useState } from "react";
import { VideoButton, PlayButton, RestartButton, PlaybackButtons } from "./buttons";
import { Sidebar, FenButton, RoiButton, StopButton } from "../common";
import type {
  ModelRefs, Roi, SetBoolean, SetRoi, SetStringArray, SidebarRef, VideoRef
} from "../../types";

const UploadSidebar = ({ videoRef, chessqueriesModelRef,
  sidebarRef, text, setText, playing, setPlaying, roi, setRoi, selecting, setSelecting, canPlay }: {
  videoRef: VideoRef,
  chessqueriesModelRef: ModelRefs["chessqueriesModelRef"],
  sidebarRef: SidebarRef,
  text: string[], setText: SetStringArray,
  playing: boolean, setPlaying: SetBoolean,
  roi: Roi | null, setRoi: SetRoi,
  selecting: boolean, setSelecting: SetBoolean,
  canPlay: boolean
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
          setPlaying={setPlaying}
          videoSelected={videoSelected}
          setVideoSelected={setVideoSelected}
        />
      </li>
      <li className="my-1" style={inputStyle}>
        <RoiButton roi={roi} setRoi={setRoi} selecting={selecting} setSelecting={setSelecting}
          canPlay={canPlay} />
      </li>
      <li className="my-1" style={inputStyle}>
        <FenButton chessqueriesModelRef={chessqueriesModelRef} videoRef={videoRef} roi={roi} setText={setText}
          canPlay={canPlay} />
      </li>
      <li className="my-1" style={inputStyle}>
        <PlaybackButtons videoRef={videoRef} videoSelected={videoSelected} />
      </li>
      <li className="my-1">
        <div className="btn-group w-100" role="group" aria-label="Video controls">
          <PlayButton videoRef={videoRef} playing={playing} setPlaying={setPlaying} videoSelected={videoSelected} />
          <StopButton videoRef={videoRef} setPlaying={setPlaying} setText={setText} disabled={!videoSelected} />
          <RestartButton videoRef={videoRef} setText={setText} videoSelected={videoSelected} />
        </div>
      </li>
    </Sidebar>
  );
};

export default UploadSidebar;
