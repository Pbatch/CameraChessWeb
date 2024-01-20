import { useEffect, useState } from "react";
import { userSelect } from "../../slices/userSlice";
import { lichessImportPgn } from "../../utils/lichess";

const Board = ({ pgn }: { pgn: string }) => {
  const [emb, setEmb] = useState<string>("");
  const token = userSelect().token;

  const getEmb = async () => {
    const data = await lichessImportPgn(token, pgn);
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