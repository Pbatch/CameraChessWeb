import { useSelector } from "react-redux";
import SidebarButton from "./sidebarButton";

const PgnButton = ({ setText, recording }) => {
  const pgn = useSelector(state => state.pgn.value);

  const handleClick = (e) => {
    e.preventDefault();

    let text;
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