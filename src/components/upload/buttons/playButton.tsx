import type { SetBoolean, VideoRef } from "../../../types";
import { SidebarButton, Icon } from "../../common";

const PlayButton = ({ videoRef, playing, setPlaying }: {
  videoRef: VideoRef, playing: boolean, setPlaying: SetBoolean
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (videoRef.current?.getAttribute("src")?.startsWith("blob:")) {
      setPlaying(!playing);
    }
  }

 return (
    <SidebarButton onClick={handleClick}>
      <Icon iconName={playing ? "bi-pause" : "bi-play"} />
    </SidebarButton>
  );
};

export default PlayButton;
