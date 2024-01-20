import ExportSidebar from "./exportSidebar";
import Board from "./board";
import { Container } from "../common";
import { gameSelect, makePgn } from "../../slices/gameSlice";

const Export = () => {
  const pgn: string = makePgn(gameSelect());

  return (
    <Container>
      <ExportSidebar pgn={pgn} />
      <Board pgn={pgn} />
    </Container>
  );
};

export default Export;