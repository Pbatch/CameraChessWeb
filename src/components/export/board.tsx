import { useEffect, useState } from "react";
import { gameSelect } from "../../slices/gameSlice";

const Board = ({ authRef }: { authRef: any }) => {
  const pgn: string = gameSelect().pgn;
  const [emb, setEmb] = useState<string>("");

  const getEmb = async () => {
    const url = "/api/import";
    const config = {body: new URLSearchParams({ pgn }), method: "POST"};
    const data = await authRef.current.fetchBody(url, config);
    const emb: string = `https://lichess.org/embed/game/${data.id}?theme=brown&bg=dark`;
    setEmb(emb);
  }

  useEffect(() => {
    getEmb();
  }, [])

  return (
    <div className="ratio ratio-21x9">
      <iframe src={emb} />
    </div>
  );
}

export default Board;