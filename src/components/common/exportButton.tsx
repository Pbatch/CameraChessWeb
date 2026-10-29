import { useEffect, useState } from "react";
import type { SetStringArray, Study } from "../../types";
import { useUser } from "../../slices/userSlice";
import { makePgn, useGame } from "../../slices/gameSlice";
import { describeLichessError, lichessImportPgnToStudy, lichessSetStudies } from "../../api/lichess";
import Dropdown, { DropdownItem, DropdownText } from "./dropdown";

const createName = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}-${hour}-${minute}-${second}`;
}

const ExportButton = ({ setText }: { setText: SetStringArray }) => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { token, username } = useUser();
  const pgn: string = makePgn(useGame());

  useEffect(() => {
    const onStudies = (studies: Study[]) => {
      setStudies(studies);
      setLoadError(null);
    }
    void lichessSetStudies(token, onStudies, username, false)
      .catch((error: unknown) => {
        console.error("Unable to load Lichess studies", error);
        setLoadError(describeLichessError(error));
      });
  }, [token, username]);

  const handleClick = async (study: Study) => {
    const name = createName();
    try {
      await lichessImportPgnToStudy(token, pgn, name, study.id);
      setText(["Exported game to", `"${study.name}/${name}"`]);
    } catch (error) {
      console.error("Unable to export game to Lichess study", error);
      setText(["Unable to export game to Lichess study", describeLichessError(error)]);
    }
  }

  return (
    <Dropdown label="Export" title="Export to a Lichess study">
      {(loadError !== null) ?
        <DropdownText>{loadError}</DropdownText> :
        (studies.length === 0) ?
        <DropdownText>No studies found</DropdownText> :
        studies.map(study =>
          <DropdownItem key={study.id} onClick={() => { void handleClick(study); }}>
            {study.name}
          </DropdownItem>
        )}
    </Dropdown>
  );
};

export default ExportButton;
