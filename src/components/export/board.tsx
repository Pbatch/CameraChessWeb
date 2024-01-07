import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../types";

const Board = ({ authRef }: { authRef: any }) => {
  const pgn: string = useSelector((state: RootState) => state.game["pgn"]);
  const [emb, setEmb] = useState<string>("");

  const getEmb = async () => {
    const url = "/api/import";
    if (pgn === "") {
      return;
    }
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