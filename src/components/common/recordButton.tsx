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
      variant={playing ? "outline-warning" : "outline-success"}
      aria-label="Move detection"
      aria-pressed={playing}
      title={playing ? "Pause" : "Play"}
    >
      <Icon iconName={playing ? "bi-pause-fill" : "bi-play-fill"} />
    </SidebarButton>
  );
};

export default RecordButton;
