import { SetBoolean } from "../../types";
import Icon from "./icon";
import SidebarButton from "./sidebarButton";

const RecordButton = ({ playing, setPlaying }: 
  { playing: boolean, setPlaying: SetBoolean }) => {
  const handleClick = (e: any) => {
    e.preventDefault();

    setPlaying(!playing);
  }

 return (
    <SidebarButton onClick={handleClick}>
      <Icon iconName={playing ? "bi-pause" : "bi-play"} />
    </SidebarButton>
  );
};

export default RecordButton;
