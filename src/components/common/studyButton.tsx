import { useState, useEffect } from "react";
import { SetStudy, Study } from "../../types";
import { userSelect } from "../../slices/userSlice";
import { lichessSetStudies } from "../../utils/lichess";

const StudyButton = ({ study, setStudy, onlyBroadcasts }: 
  {study: Study | null, setStudy: SetStudy, onlyBroadcasts: boolean }
) => {
  const [studies, setStudies] = useState<Study[]>([]);
  const user = userSelect();

  useEffect(() => {
    lichessSetStudies(user.token, setStudies, user.username, onlyBroadcasts);
  }, []);

  const handleClick = (e: any, study: Study) => {
    e.preventDefault();
    setStudy(study);
  }

  return (
    <div className="dropdown">
      <button className="btn btn-dark btn-sm btn-outline-light dropdown-toggle w-100" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
        {(study === null) ? "Select a Study": `Study: ${study.name}`}
      </button>
      <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
        {studies.map(study => 
          <li key={study.id}>
            <a onClick={(e) => handleClick(e, study)} className="dropdown-item" href="#">{study.name} ({study.id})</a>
          </li>
        )}
      </ul>
    </div>
  );
};

export default StudyButton;