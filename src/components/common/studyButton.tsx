import { useTranslation } from "react-i18next";
import type { SetStudy, Study } from "../../types";
import { useUser } from "../../slices/userSlice";
import { useLichessStudies } from "../../utils/useLichessStudies";
import { Notebook } from "lucide-react";
import Dropdown, { DropdownItem, DropdownText } from "./dropdown";

const StudyButton = ({ study, setStudy, onlyBroadcasts, disabled = false }:
  { study: Study | null, setStudy: SetStudy, onlyBroadcasts: boolean, disabled?: boolean }
) => {
  const user = useUser();
  const { studies, loadError } = useLichessStudies(user.token, user.username, onlyBroadcasts);
  const { t } = useTranslation();

  const handleClick = (study: Study) => {
    setStudy(study);
  }

  const label = (study === null) ? t("study.select") : t("study.selected", { name: study.name });

  return (
    <Dropdown icon={Notebook} label={label} disabled={disabled}>
      {(loadError !== null) ?
        <DropdownText>{loadError}</DropdownText> :
        (studies.length === 0) ?
        <DropdownText>{t("common.noStudies")}</DropdownText> :
        studies.map(study =>
          <DropdownItem key={study.id} onClick={() => handleClick(study)}>{study.name} ({study.id})</DropdownItem>
        )}
    </Dropdown>
  );
};

export default StudyButton;
