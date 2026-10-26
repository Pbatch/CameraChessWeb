import type { SetBoolean, VideoRef } from "../../../types";
import { SidebarButton, Icon } from "../../common";

const PlayButton = ({ videoRef, playing, setPlaying, videoSelected }: {
  videoRef: VideoRef, playing: boolean, setPlaying: SetBoolean, videoSelected: boolean
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (videoRef.current?.getAttribute("src")?.startsWith("blob:")) {
      setPlaying(!playing);
    }
  }

 return (
    <SidebarButton
      onClick={handleClick}
      variant={playing ? "outline-warning" : "outline-success"}
      disabled={!videoSelected}
      aria-label="Video playback"
      aria-pressed={playing}
      title={playing ? "Pause video" : "Play video"}
    >
      <Icon iconName={playing ? "bi-pause-fill" : "bi-play-fill"} />
    </SidebarButton>
  );
};

export default PlayButton;
