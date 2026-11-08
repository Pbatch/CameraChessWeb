import { useTranslation } from "react-i18next";
import { Sidebar, SidebarSection, FenButton, DeviceButton, RoiButton } from "../common";
import type {
  Camera, ModelRefs, Roi, SetBoolean, SetRoi, SetStringArray, VideoRef
} from "../../types";

// Recording is controlled from the bar over the camera (cameraControls.tsx)
const RecordSidebar = ({ chessqueriesModelRef, videoRef, camera,
  playing, text, setText, roi, setRoi, selecting, setSelecting, canPlay }: {
  chessqueriesModelRef: ModelRefs["chessqueriesModelRef"],
  videoRef: VideoRef,
  camera: Camera,
  playing: boolean,
  text: string[], setText: SetStringArray,
  roi: Roi | null, setRoi: SetRoi,
  selecting: boolean, setSelecting: SetBoolean,
  canPlay: boolean
}) => {
  const { t } = useTranslation();

  return (
    // The board always shows, so pausing to check the game moves nothing
    <Sidebar playing={playing} text={text} setText={setText} exportable={true} setupFirst={true} showBoard={true}>
      {/* Stays while recording, disabled, except on landscape phones, which need the room */}
      <SidebarSection title={t("common.setup")} className={playing ? "sidebar-section--hidden-short" : ""}>
        <DeviceButton camera={camera} disabled={playing} />
        <RoiButton roi={roi} setRoi={setRoi} selecting={selecting} setSelecting={setSelecting}
          canPlay={canPlay && !playing} />
        <FenButton chessqueriesModelRef={chessqueriesModelRef} videoRef={videoRef} roi={roi} setText={setText}
          canPlay={canPlay && !playing} />
      </SidebarSection>
    </Sidebar>
  );
};

export default RecordSidebar;
