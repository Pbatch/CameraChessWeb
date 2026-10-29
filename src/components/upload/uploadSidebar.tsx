import { useState } from "react";
import { VideoButton, PlayButton, RestartButton, PlaybackButtons } from "./buttons";
import { Sidebar, SidebarSection, FenButton, RoiButton, StopButton, ButtonGroup } from "../common";
import type {
  ModelRefs, Roi, SetBoolean, SetRoi, SetStringArray, VideoRef
} from "../../types";

const UploadSidebar = ({ videoRef, chessqueriesModelRef,
  text, setText, playing, setPlaying, roi, setRoi, selecting, setSelecting, canPlay }: {
  videoRef: VideoRef,
  chessqueriesModelRef: ModelRefs["chessqueriesModelRef"],
  text: string[], setText: SetStringArray,
  playing: boolean, setPlaying: SetBoolean,
  roi: Roi | null, setRoi: SetRoi,
  selecting: boolean, setSelecting: SetBoolean,
  canPlay: boolean
}) => {
  const [videoSelected, setVideoSelected] = useState(false);

  return (
    <Sidebar playing={playing} text={text} setText={setText} exportable={true} >
      <SidebarSection title="Setup" hidden={playing}>
        <VideoButton
          videoRef={videoRef}
          setPlaying={setPlaying}
          videoSelected={videoSelected}
          setVideoSelected={setVideoSelected}
        />
        <RoiButton roi={roi} setRoi={setRoi} selecting={selecting} setSelecting={setSelecting}
          canPlay={canPlay} />
        <FenButton chessqueriesModelRef={chessqueriesModelRef} videoRef={videoRef} roi={roi} setText={setText}
          canPlay={canPlay} />
        <PlaybackButtons videoRef={videoRef} videoSelected={videoSelected} />
      </SidebarSection>
      <SidebarSection title="Playback">
        <ButtonGroup label="Video controls">
          <PlayButton videoRef={videoRef} playing={playing} setPlaying={setPlaying} videoSelected={videoSelected} />
          <StopButton videoRef={videoRef} setPlaying={setPlaying} setText={setText} disabled={!videoSelected} />
          <RestartButton videoRef={videoRef} setText={setText} videoSelected={videoSelected} />
        </ButtonGroup>
      </SidebarSection>
    </Sidebar>
  );
};

export default UploadSidebar;
