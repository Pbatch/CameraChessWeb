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
      text = ["Copied PGN", `"${pgn}"`]
    }

    if (!(recording)) {
      setText(text);
    }
  }

  return (
    <button className="btn btn-dark btn-sm btn-outline-light" onClick={handleClick}>
      Copy PGN
    </button>
  );
};

export default PgnButton;