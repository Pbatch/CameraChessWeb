import { useDispatch } from "react-redux";
import { gameResetPgnAndFen } from "../../../slices/gameSlice";
import { SidebarButton, Icon } from "../../common";

const StopButton = ({ videoRef, setPlaying, setText }: {
  videoRef: any, setPlaying: React.Dispatch<React.SetStateAction<boolean>>, 
  setText: React.Dispatch<React.SetStateAction<string[]>>
}) => {
  const dispatch = useDispatch();

  const handleClick = (e: any) => {
    e.preventDefault();
    
    if (videoRef.current.src.startsWith("blob")) {
      setPlaying(false);
      dispatch(gameResetPgnAndFen());
      setText(["Reset PGN to start position"])
    }
  }

 return (
    <SidebarButton onClick={handleClick}>
      <Icon iconName="bi-stop" />
    </SidebarButton>
  );
};

export default StopButton;
