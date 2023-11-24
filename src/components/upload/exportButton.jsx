import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const ExportButton = ({ study, setText, auth }) => {
  const pgn = useSelector(state => state.pgn.value);
  const [style, setStyle] = useState({"display": "none"});

  const createName = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    const name = `${year}-${month}-${day}-${hour}-${minute}-${second}`;
    return name
  }

  const importPgnToStudy = async () => {
    if (pgn === "") {
      setText(["Cannot export empty PGN"])
      return;
    }
    const url = `/api/study/${study.id}/import-pgn`;
    const name = createName();
    const config = {body: new URLSearchParams({ pgn: pgn, name: name }), method: "POST"};
    await auth.fetchBody(url, config);
    setText(["Exported game to", `"${study.name}/${name}"`]);
  }

  const handleClick = (e) => {
    e.preventDefault();
    
    if (study.id != "n/a") {
      importPgnToStudy(pgn);
    }
  }

  useEffect(() => {
    const display = (pgn === "" || study === null) ? "none" : "inline-block";
    setStyle({"display": display});
  }, [study, pgn])

  return (
    <button className="btn btn-dark btn-sm btn-outline-light" onClick={handleClick}
    style={style}>
      Export Game
    </button>
  );
};

export default ExportButton;