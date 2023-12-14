import { useSelector } from "react-redux";

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
    <button className="btn btn-dark btn-sm btn-outline-light w-100" onClick={handleClick}>
      Copy PGN
    </button>
  );
};

export default PgnButton;