import SidebarButton from "./sidebarButton";
import { SetStringArray } from "../../types";
import { makePgn, useGame } from "../../slices/gameSlice";

const PgnButton = ({ setText, playing }: {setText: SetStringArray, playing: boolean}) => {
  const pgn: string = makePgn(useGame());

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    void navigator.clipboard.writeText(pgn)
      .then(() => {
        if (!playing) {
          setText(["Copied PGN"]);
        }
      })
      .catch((error: unknown) => {
        console.error("Unable to copy PGN", error);
        if (!playing) {
          setText(["Unable to copy PGN"]);
        }
      });
  }

  return (
    <SidebarButton onClick={handleClick}>
      Copy PGN
    </SidebarButton>
  );
};

export default PgnButton;
