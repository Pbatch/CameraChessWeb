import { useDispatch } from "react-redux";
import type { SetBoolean, SetStringArray, VideoRef } from "../../types";
import { gameResetFen, gameResetMoves } from "../../slices/gameSlice";
import SidebarButton from "./sidebarButton";
import Icon from "./icon";

const StopButton = ({ setPlaying, setText, videoRef, disabled = false }: {
  setPlaying: SetBoolean, setText: SetStringArray, videoRef?: VideoRef, disabled?: boolean
}) => {
  const dispatch = useDispatch();
  const label = videoRef ? "Stop and reset video" : "Stop and reset game";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Uploaded videos only have something to reset once a file is loaded
    if (videoRef && !videoRef.current?.src.startsWith("blob")) {
      return;
    }

    setPlaying(false);
    dispatch(gameResetMoves());
    dispatch(gameResetFen());
    setText(["Reset to start position"])
  }

 return (
    <SidebarButton onClick={handleClick} disabled={disabled} aria-label={label} title={label}>
      <Icon iconName="bi-stop" />
    </SidebarButton>
  );
};

export default StopButton;
