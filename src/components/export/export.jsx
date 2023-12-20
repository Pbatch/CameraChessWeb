import ExportSidebar from "./exportSidebar";
import Board from "./board";
import { Container } from "../common";
import { useOutletContext } from "react-router-dom";

const Export = () => {
  const context = useOutletContext();

  return (
    <Container>
      <ExportSidebar authRef={context.authRef} />
      <Board authRef={context.authRef} />
    </Container>
  );
};

export default Export;