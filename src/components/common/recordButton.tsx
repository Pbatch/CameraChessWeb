import type { SetBoolean } from "../../types";
import Icon from "./icon";
import SidebarButton from "./sidebarButton";

const RecordButton = ({ playing, setPlaying }: 
  { playing: boolean, setPlaying: SetBoolean }) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    setPlaying(!playing);
  }

 return (
    <SidebarButton
      onClick={handleClick}
      aria-label="Move detection"
      aria-pressed={playing}
      title={playing ? "Pause" : "Play"}
    >
      <Icon iconName={playing ? "bi-pause" : "bi-play"} />
    </SidebarButton>
  );
};

export default RecordButton;
