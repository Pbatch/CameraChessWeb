import type { SetBoolean, SetStringArray } from "../../types";
import { gameRestart } from "../../slices/gameSlice";
import SidebarButton from "./sidebarButton";
import { Square } from "lucide-react";
import Icon from "./icon";

const StopButton = ({ setPlaying, setText }: { setPlaying: SetBoolean, setText: SetStringArray }) => {
  const label = "Stop and reset game";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setPlaying(false);
    gameRestart();
    setText(["Reset to start position"])
  }

 return (
    <SidebarButton onClick={handleClick} variant="outline-danger" aria-label={label} title={label}>
      <Icon icon={Square} filled={true} />
    </SidebarButton>
  );
};

export default StopButton;
