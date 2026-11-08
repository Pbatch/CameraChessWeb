import { useTranslation } from "react-i18next";
import { useState } from "react";
import { VideoButton } from "./buttons";
import { Sidebar, SidebarSection, FenButton, RoiButton } from "../common";
import type {
  ModelRefs, Roi, SetBoolean, SetRoi, SetStringArray, VideoRef
} from "../../types";

// Playback is in the controls over the video (videoControls.tsx)
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
  const { t } = useTranslation();
  const [videoSelected, setVideoSelected] = useState(false);

  return (
    // The board always shows, so loading a video or pausing to check the game moves nothing. With Setup also
    // showing, a landscape phone's sidebar then scrolls.
    <Sidebar playing={playing} text={text} setText={setText} exportable={true} setupFirst={true} showBoard={true}>
      {/* Stays while playing, disabled, so the board below doesn't move, except on landscape phones, which
          need the room */}
      <SidebarSection title={t("common.setup")} className={playing ? "sidebar-section--hidden-short" : ""}>
        <VideoButton
          videoRef={videoRef}
          setPlaying={setPlaying}
          videoSelected={videoSelected}
          setVideoSelected={setVideoSelected}
          disabled={playing}
        />
        <RoiButton roi={roi} setRoi={setRoi} selecting={selecting} setSelecting={setSelecting}
          canPlay={canPlay && !playing} />
        <FenButton chessqueriesModelRef={chessqueriesModelRef} videoRef={videoRef} roi={roi} setText={setText}
          canPlay={canPlay && !playing} />
      </SidebarSection>
    </Sidebar>
  );
};

export default UploadSidebar;
