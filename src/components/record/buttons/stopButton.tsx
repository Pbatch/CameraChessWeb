import { useDispatch } from "react-redux";
import { gameResetPgnAndFen } from "../../../slices/gameSlice";
import { SidebarButton, Icon } from "../../common";

const StopButton = ({ setPlaying, setText }: 
  { setPlaying: React.Dispatch<React.SetStateAction<boolean>>, 
    setText: React.Dispatch<React.SetStateAction<string[]>>}
  ) => {
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
