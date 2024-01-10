import { SidebarButton } from "../../common";
import { Study, setStringArray } from "../../../types";
import { gameSelect } from "../../../slices/gameSlice";

const ExportButton = ({ study, setText, authRef }: 
  {study: Study | null, setText: setStringArray, authRef: any}) => {
  const pgn: string = gameSelect().pgn;

  const createName = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    const name = `${year}-${month}-${day}-${hour}-${minute}-${second}`;
    return name
  }

  const importPgnToStudy = async () => {
    if (study === null) {
      setText(["Please select a study"])
      return;
    }
    const url = `/api/study/${study.id}/import-pgn`;
    const name = createName();
    const config = {body: new URLSearchParams({ pgn: pgn, name: name }), method: "POST"};
    await authRef.current.fetchBody(url, config);
    setText(["Exported game to", `"${study.name}/${name}"`]);
  }

  return (
    <SidebarButton onClick={importPgnToStudy}>
      Export Game 
    </SidebarButton>
  );
};

export default ExportButton;