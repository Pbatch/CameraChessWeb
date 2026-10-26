import { useState, useEffect } from "react";
import type { SetStudy, Study } from "../../types";
import { useUser } from "../../slices/userSlice";
import { lichessSetStudies } from "../../api/lichess";
import Icon from "./icon";

const StudyButton = ({ study, setStudy, onlyBroadcasts }: 
  {study: Study | null, setStudy: SetStudy, onlyBroadcasts: boolean }
) => {
  const [studies, setStudies] = useState<Study[]>([]);
  const user = useUser();

  useEffect(() => {
    void lichessSetStudies(user.token, setStudies, user.username, onlyBroadcasts)
      .catch((error: unknown) => console.error("Unable to load Lichess studies", error));
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
        {studies.map(study => 
          <li key={study.id}>
            <button type="button" onClick={() => handleClick(study)} className="dropdown-item">{study.name} ({study.id})</button>
          </li>
        )}
      </ul>
    </div>
  );
};

export default StudyButton;
