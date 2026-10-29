import type { SetBoolean, SetStringArray, VideoRef } from "../../types";
import { gameRestart } from "../../slices/gameSlice";
import SidebarButton from "./sidebarButton";
import { Square } from "lucide-react";
import Icon from "./icon";

const StopButton = ({ setPlaying, setText, videoRef, disabled = false }: {
  setPlaying: SetBoolean, setText: SetStringArray, videoRef?: VideoRef, disabled?: boolean
}) => {
  const label = videoRef ? "Stop and reset video" : "Stop and reset game";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Uploaded videos only have something to reset once a file is loaded
    if (videoRef && !videoRef.current?.src.startsWith("blob")) {
      return;
    }

    setPlaying(false);
    gameRestart();
    setText(["Reset to start position"])
  }

 return (
    <SidebarButton onClick={handleClick} variant="outline-danger" disabled={disabled} aria-label={label} title={label}>
      <Icon icon={Square} filled={true} />
    </SidebarButton>
  );
};

export default StopButton;
