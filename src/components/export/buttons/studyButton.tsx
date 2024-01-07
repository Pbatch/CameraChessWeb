import { useState, useEffect } from "react";
import { Study } from "../../../types";

const readStream = (processLine: any) => (response: any) => {
  const stream = response.body.getReader();
  const matcher = /\r?\n/;
  const decoder = new TextDecoder();
  let buf: any = '';

  const loop = () =>
    stream.read().then(({ done, value }: {done: boolean, value: any}) => {
      if (done) {
        if (buf.length > 0) processLine(JSON.parse(buf));
      } else {
        const chunk = decoder.decode(value, {
          stream: true
        });
        buf += chunk;

        const parts = buf.split(matcher);
        buf = parts.pop();
        for (const i of parts.filter((p: any) => p)) processLine(JSON.parse(i));
        return loop();
      }
    });

  return loop();
}

const StudyButton = ({ study, setStudy, authRef }:
  {study: Study | null, setStudy: React.Dispatch<React.SetStateAction<Study | null>>, authRef: any}
) => {
  const [studies, setStudies] = useState<Study[]>([]);

  useEffect(() => {
    const setStudiesAsync = (async () => {
      const newStudies: Study[] = [];
      const username = authRef.current.me.username;
      await authRef.current.fetchResponse(`/api/study/by/${username}`, {method: "GET"}).then(
        readStream((response: any) => newStudies.push({"id": response.id, "name": response.name}))
      ).then(() => setStudies(newStudies));
    });
    setStudiesAsync();
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