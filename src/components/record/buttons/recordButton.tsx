import { setBoolean } from "../../../types";
import { SidebarButton, Icon } from "../../common";

const RecordButton = ({ playing, setPlaying }: 
  { playing: boolean, setPlaying: setBoolean }) => {
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
