import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const Board = ({ authRef }) => {
  const pgn = useSelector(state => state.pgn.value);

  const [emb, setEmb] = useState(null);

  const getEmb = async () => {
    const url = "/api/import";
    if (pgn === "") {
      return;
    }
    const config = {body: new URLSearchParams({ pgn }), method: "POST"};
    const data = await authRef.current.fetchBody(url, config);
    const emb = `https://lichess.org/embed/game/${data.id}?theme=brown&bg=dark`;
    setEmb(emb);
  }

  useEffect(() => {
    getEmb();
  }, [])

  return (
    <div className="ratio ratio-21x9">
      <iframe src={emb} overflow="hidden"/>
    </div>
  );
}

export default Board;