import ExportSidebar from "./exportSidebar";
import Board from "./board";
import { Container } from "../common";
import { makePgn, useGame } from "../../slices/gameSlice";

const Export = () => {
  const pgn: string = makePgn(useGame());

  return (
    <Container>
      <ExportSidebar pgn={pgn} />
      <Board pgn={pgn} />
    </Container>
  );
};

export default Export;
