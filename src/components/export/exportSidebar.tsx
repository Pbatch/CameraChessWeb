import { useState } from "react";
import { HomeButton, Display, Sidebar } from "../common";
import { StudyButton, ExportButton } from "./buttons";
import { Study } from "../../types";

const UploadSidebar = ({ authRef }: { authRef: any}) => {
  const [study, setStudy] = useState<Study | null>(null);
  const [text, setText] = useState<string[]>(["Select a study", "Export the game"]);

  return (
    <Sidebar>
      <li className="border-top"></li>
      <li className="my-2">
        <StudyButton study={study} setStudy={setStudy} authRef={authRef} />
      </li>
      <li className="my-2">
        <ExportButton study={study} setText={setText} authRef={authRef} />
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