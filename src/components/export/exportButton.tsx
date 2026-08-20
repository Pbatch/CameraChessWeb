import { SidebarButton } from "../common";
import { Study, SetStringArray } from "../../types";
import { useUser } from "../../slices/userSlice";
import { lichessImportPgnToStudy } from "../../utils/lichess";

const ExportButton = ({ study, setText, pgn }: 
  {study: Study | null, setText: SetStringArray, pgn: string}) => {
  const token: string = useUser().token;

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
    const name = createName();
    try {
      await lichessImportPgnToStudy(token, pgn, name, study.id);
      setText(["Exported game to", `"${study.name}/${name}"`]);
    } catch (error) {
      console.error("Unable to export game to Lichess study", error);
      setText(["Unable to export game to Lichess study"]);
    }
  }

  return (
    <SidebarButton onClick={() => { void importPgnToStudy(); }}>
      Export Game 
    </SidebarButton>
  );
};

export default ExportButton;
