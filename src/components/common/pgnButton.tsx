import SidebarButton from "./sidebarButton";
import { setStringArray } from "../../types";
import { gameSelect } from "../../slices/gameSlice";

const PgnButton = ({ setText, playing }: {setText: setStringArray, playing: boolean}) => {
  const pgn: string = gameSelect().pgn;

  const handleClick = (e: any) => {
    e.preventDefault();

    let text: string[];
    if (pgn === "") {
      text = ["Cannot copy empty PGN"]
    } else {
      navigator.clipboard.writeText(pgn);
      text = ["Copied PGN"]
    }

    if (!playing) {
      setText(text);
    }
  }

  return (
    <SidebarButton onClick={handleClick}>
      Copy PGN
    </SidebarButton>
  );
};

export default PgnButton;