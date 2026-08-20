import { useDispatch } from "react-redux";
import { gameResetFen, gameResetMoves } from "../../../slices/gameSlice";
import { SidebarButton, Icon } from "../../common";
import { SetBoolean, SetStringArray, VideoRef } from "../../../types";

const StopButton = ({ videoRef, setPlaying, setText }: {
  videoRef: VideoRef, setPlaying: SetBoolean, setText: SetStringArray
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
    <SidebarButton onClick={handleClick}>
      <Icon iconName="bi-stop" />
    </SidebarButton>
  );
};

export default StopButton;
