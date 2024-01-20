import { useDispatch } from "react-redux";
import { gameResetFen, gameResetMoves } from "../../../slices/gameSlice";
import { SidebarButton, Icon } from "../../common";
import { SetBoolean, SetStringArray } from "../../../types";

const StopButton = ({ videoRef, setPlaying, setText }: {
  videoRef: any, setPlaying: SetBoolean, setText: SetStringArray
}) => {
  const dispatch = useDispatch();

  const handleClick = (e: any) => {
    e.preventDefault();
    
    if (videoRef.current.src.startsWith("blob")) {
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
