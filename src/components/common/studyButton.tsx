import { useState, useEffect } from "react";
import type { SetStudy, Study } from "../../types";
import { useUser } from "../../slices/userSlice";
import { describeLichessError, lichessSetStudies } from "../../api/lichess";
import { Notebook } from "lucide-react";
import Dropdown, { DropdownItem, DropdownText } from "./dropdown";

const StudyButton = ({ study, setStudy, onlyBroadcasts }: 
  {study: Study | null, setStudy: SetStudy, onlyBroadcasts: boolean }
) => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const user = useUser();

  useEffect(() => {
    const onStudies = (studies: Study[]) => {
      setStudies(studies);
      setLoadError(null);
    }
    void lichessSetStudies(user.token, onStudies, user.username, onlyBroadcasts)
      .catch((error: unknown) => {
        console.error("Unable to load Lichess studies", error);
        setLoadError(describeLichessError(error));
      });
  }, [onlyBroadcasts, user.token, user.username]);

  const handleClick = (study: Study) => {
    setStudy(study);
  }

  const label = (study === null) ? "Select a Study" : `Study: ${study.name}`;

  return (
    <Dropdown icon={Notebook} label={label}>
      {(loadError !== null) ?
        <DropdownText>{loadError}</DropdownText> :
        (studies.length === 0) ?
        <DropdownText>No studies found</DropdownText> :
        studies.map(study =>
          <DropdownItem key={study.id} onClick={() => handleClick(study)}>{study.name} ({study.id})</DropdownItem>
        )}
    </Dropdown>
  );
};

export default StudyButton;
