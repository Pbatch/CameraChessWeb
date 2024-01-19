import { useState } from "react";
import { HomeButton, Display, Sidebar, StudyButton } from "../common";
import ExportButton from "./exportButton";
import { Study } from "../../types";

const UploadSidebar = ({ pgn }: { pgn: string }) => {
  const [study, setStudy] = useState<Study | null>(null);
  const [text, setText] = useState<string[]>(["Select a study", "Export the game"]);

  return (
    <Sidebar>
      <li className="border-top"></li>
      <li className="my-2">
        <StudyButton study={study} setStudy={setStudy} onlyBroadcasts={false} />
      </li>
      <li className="my-2">
        <ExportButton study={study} setText={setText} pgn={pgn} />
      </li>
      <li className="border-top"></li>
      <li className="my-2">
        <Display text={text} />
      </li>
      <li className="border-top"></li>
      <li className="my-2">
        <HomeButton />
      </li>
    </Sidebar>
  );
};

export default UploadSidebar;