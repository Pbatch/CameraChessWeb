import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import type { SetStringArray, Study } from "../../types";
import { useUser } from "../../slices/userSlice";
import { makePgn, useGame } from "../../slices/gameSlice";
import { describeLichessError, lichessImportGame, lichessImportPgnToStudy } from "../../api/lichess";
import { useLichessStudies } from "../../utils/useLichessStudies";
import { useCopyPgn } from "../../utils/useCopyPgn";
import Dropdown, { DropdownDivider, DropdownHeading, DropdownItem, DropdownText } from "./dropdown";
import SignInItems from "./signInItems";

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

// Sends the game to Lichess: as a game of its own, which needs no login, or to one of the user's studies, which does
const ExportButton = ({ setText }: { setText: SetStringArray }) => {
  const { t } = useTranslation();
  const { token, username } = useUser();
  const { studies, loadError } = useLichessStudies(token, username, false);
  const copy = useCopyPgn(setText);
  const game = useGame();
  const pgn: string = makePgn(game);
  const { pathname } = useLocation();
  const loggedIn = (token !== "");

  const openInLichess = async () => {
    // Opened now, while the click still counts, as browsers block a window opened after waiting for Lichess
    const page = window.open("", "_blank");
    try {
      const url = await lichessImportGame(pgn);
      if (page !== null) {
        page.opener = null;
        page.location.href = url;
      } else {
        window.open(url, "_blank", "noopener");
      }
      setText([t("export.opened")]);
    } catch (error) {
      page?.close();
      console.error("Unable to import game to Lichess", error);
      setText([t("export.openFailed"), describeLichessError(error)]);
    }
  }

  const exportToStudy = async (study: Study) => {
    const name = createName();
    try {
      await lichessImportPgnToStudy(token, pgn, name, study.id);
      setText([t("export.exported"), `"${study.name}/${name}"`]);
    } catch (error) {
      console.error("Unable to export game to Lichess study", error);
      setText([t("export.exportFailed"), describeLichessError(error)]);
    }
  }

  const copyPgn = () => copy(pgn);

  const studyItems = () => {
    if (loadError !== null) {
      return <DropdownText>{loadError}</DropdownText>;
    }
    if (studies.length === 0) {
      return <DropdownText>{t("common.noStudies")}</DropdownText>;
    }
    return studies.map(study =>
      <DropdownItem key={study.id} onClick={() => { void exportToStudy(study); }}>
        {study.name}
      </DropdownItem>
    );
  }


  return (
    <Dropdown label={t("export.button")} title={t("export.title")}>
      <DropdownItem onClick={() => { void openInLichess(); }}>{t("export.open")}</DropdownItem>
      <DropdownDivider />
      <DropdownHeading>{t("export.addToStudy")}</DropdownHeading>
      {/* Signing out is in the header's account menu, with the rest of the account */}
      {loggedIn ? studyItems()
        : <SignInItems returnTo={pathname} gameInProgress={game.moves !== ""} onCopyPgn={copyPgn} />}
    </Dropdown>
  );
};

export default ExportButton;
