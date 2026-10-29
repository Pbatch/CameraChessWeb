import { useState, useEffect } from "react";
import type { SetStudy, Study } from "../../types";
import { useUser } from "../../slices/userSlice";
import { describeLichessError, lichessSetStudies } from "../../api/lichess";
import Icon from "./icon";

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
    <div className="dropdown">
      <button type="button" className="btn btn-dark btn-sm btn-outline-light dropdown-toggle w-100 d-flex align-items-center justify-content-center" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false"
        title={label}>
        <Icon iconName="bi-journal" className="me-2" />
        <span className="text-truncate">{label}</span>
      </button>
      <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
        {(loadError !== null) ?
          <li><span className="dropdown-item-text">{loadError}</span></li> :
          (studies.length === 0) ?
          <li><span className="dropdown-item-text">No studies found</span></li> :
          studies.map(study =>
            <li key={study.id}>
              <button type="button" onClick={() => handleClick(study)} className="dropdown-item">{study.name} ({study.id})</button>
            </li>
          )}
      </ul>
    </div>
  );
};

export default StudyButton;
