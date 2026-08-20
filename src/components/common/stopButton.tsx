import { useDispatch } from "react-redux";
import type { SetBoolean, SetStringArray } from "../../types";
import { gameResetFen, gameResetMoves } from "../../slices/gameSlice";
import SidebarButton from "./sidebarButton";
import Icon from "./icon";

const StopButton = ({ setPlaying, setText }: { setPlaying: SetBoolean, setText: SetStringArray }) => {
  const dispatch = useDispatch();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    setPlaying(false);
    dispatch(gameResetMoves());
    dispatch(gameResetFen());
    setText(["Reset to start position"])
  }

 return (
    <SidebarButton onClick={handleClick} aria-label="Stop and reset game" title="Stop and reset game">
      <Icon iconName="bi-stop" />
    </SidebarButton>
  );
};

export default StopButton;
