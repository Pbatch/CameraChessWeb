import { useEffect, useState } from "react";
import { useUser } from "../../slices/userSlice";
import { lichessImportPgn } from "../../utils/lichess";

const Board = ({ pgn }: { pgn: string }) => {
  const [emb, setEmb] = useState<string>("");
  const token = useUser().token;

  useEffect(() => {
    void lichessImportPgn(token, pgn).then((data) => {
      setEmb(`https://lichess.org/embed/game/${data.id}?theme=brown&bg=dark`);
    });
  }, [pgn, token])

  return (
    <div className="ratio ratio-21x9">
      <iframe src={emb} title="Imported Lichess game board" />
    </div>
  );
}

export default Board;
