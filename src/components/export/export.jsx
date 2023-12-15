import ExportSidebar from "./exportSidebar.jsx";
import Board from "./board.jsx";
import { useEffect } from "react";
import { Auth } from "./auth.jsx";
import { Container } from "../common";

const Upload = () => {
  const auth = new Auth();

  useEffect(() => {
    auth.init();
  }, []);

  return (
    <Container>
      <ExportSidebar auth={auth} />
      <Board auth={auth} />
    </Container>
  );
};

export default Upload;