import { useDispatch } from "react-redux";
import { gameResetPgnAndFen } from "../../../slices/gameSlice";
import { SidebarButton, Icon } from "../../common";
import { setBoolean, setStringArray } from "../../../types";

const StopButton = ({ setPlaying, setText }: { setPlaying: setBoolean, setText: setStringArray }) => {
  const dispatch = useDispatch();

  const handleClick = (e: any) => {
    e.preventDefault();

    setPlaying(false);
    dispatch(gameResetPgnAndFen());
    setText(["Reset PGN to start position"])
  }

 return (
    <SidebarButton onClick={handleClick}>
      <Icon iconName="bi-stop" />
    </SidebarButton>
  );
};

export default StopButton;
