import { useDispatch } from "react-redux";
import { gameResetFen, gameResetMoves } from "../../../slices/gameSlice";
import { SidebarButton, Icon } from "../../common";
import type { SetBoolean, SetStringArray, VideoRef } from "../../../types";

const StopButton = ({ videoRef, setPlaying, setText, videoSelected }: {
  videoRef: VideoRef, setPlaying: SetBoolean, setText: SetStringArray, videoSelected: boolean
}) => {
  const dispatch = useDispatch();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (videoRef.current?.src.startsWith("blob")) {
      setPlaying(false);
      dispatch(gameResetMoves());
      dispatch(gameResetFen());
      setText(["Reset to start position"])
    }
  }

 return (
    <SidebarButton
      onClick={handleClick}
      disabled={!videoSelected}
      aria-label="Stop and reset video"
      title="Stop and reset video"
    >
      <Icon iconName="bi-stop" />
    </SidebarButton>
  );
};

export default StopButton;
