import SidebarButton from "./sidebarButton";
import { SetStringArray } from "../../types";
import { gameSelect, makePgn } from "../../slices/gameSlice";

const PgnButton = ({ setText, playing }: {setText: SetStringArray, playing: boolean}) => {
  const pgn: string = makePgn(gameSelect());

  const handleClick = (e: any) => {
    e.preventDefault();

    navigator.clipboard.writeText(pgn);

    if (!playing) {
      setText(["Copied PGN"]);
    }
  }

  return (
    <SidebarButton onClick={handleClick}>
      Copy PGN
    </SidebarButton>
  );
};

export default PgnButton;