import type { SetBoolean } from "../../types";
import { Pause, Play } from "lucide-react";
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
      <Icon icon={playing ? Pause : Play} filled={true} />
    </SidebarButton>
  );
};

export default RecordButton;
