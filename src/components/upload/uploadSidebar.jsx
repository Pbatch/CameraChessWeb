import { useState } from "react";
import StudyButton from "./studyButton.jsx";
import ExportButton from "./exportButton.jsx";
import Display from "../common/display.jsx";
import NavRecordButton from "./navRecordButton.jsx";

const UploadSidebar = ({ auth }) => {
  const [study, setStudy] = useState(null);
  const [text, setText] = useState(["Select a study", "Export the game"]);

  return (
    <div className="d-flex flex-column text-center bg-dark">
      <div className="navbar-brand text-light h1 my-2">
        ChessCam
      </div>
      <ul className="nav nav-pills flex-column">
        <li className="border-top"></li>
        <li className="my-2">
          <StudyButton study={study} setStudy={setStudy} auth={auth} />
        </li>
        <li className="my-2">
          <ExportButton study={study} setText={setText} auth={auth} />
        </li>
        <li className="border-top"></li>
        <li className="my-2 text-light">
          <Display text={text} />
        </li>
        <li className="border-top"></li>
        <li className="my-2">
          <NavRecordButton />
        </li>
      </ul>
    </div>
  );
};

export default UploadSidebar;