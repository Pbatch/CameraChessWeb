import ExportSidebar from "./exportSidebar.jsx";
import Board from "./board.jsx";
import { useEffect } from "react";
import { Auth } from "./auth.jsx";

const Upload = () => {
  const auth = new Auth();

  useEffect(() => {
    auth.init();
  }, []);

  return (
    <div className="d-flex bg-dark h-100">
      <ExportSidebar auth={auth} />
      <Board auth={auth} />
    </div>
  );
};

export default Upload;