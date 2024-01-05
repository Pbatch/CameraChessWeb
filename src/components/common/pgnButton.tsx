import { useSelector } from "react-redux";
import SidebarButton from "./sidebarButton";
import { RootState } from "../../types";

const PgnButton = ({ setText, recording }:
  {setText: React.Dispatch<React.SetStateAction<string[]>>, recording: boolean}) => {
  const pgn = useSelector((state: RootState) => state.pgn["value"]);

  const handleClick = (e: any) => {
    e.preventDefault();

    let text: string[];
    if (pgn == "") {
      text = ["Cannot copy empty PGN"]
    } else {
      navigator.clipboard.writeText(pgn);
      text = ["Copied PGN"]
    }

    if (!recording) {
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