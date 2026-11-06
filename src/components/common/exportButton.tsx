import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import type { SetStringArray, Study } from "../../types";
import { useUser } from "../../slices/userSlice";
import { makePgn, useGame } from "../../slices/gameSlice";
import {
  describeLichessError, lichessImportGame, lichessImportPgnToStudy, lichessLogin, lichessLogout, lichessSetStudies
} from "../../api/lichess";
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

const Divider = () => <hr className="my-2 border-white/15" />;

// A heading for a part of the menu, which can't be chosen
const MenuHeading = ({ children }: { children: string }) =>
  <div className="px-4 py-1 text-sm opacity-65">{children}</div>;

// Sends the game to Lichess: as a game of its own, which needs no login, or to one of the user's studies, which does
const ExportButton = ({ setText }: { setText: SetStringArray }) => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { token, username } = useUser();
  const game = useGame();
  const pgn: string = makePgn(game);
  const { pathname } = useLocation();
  const loggedIn = (token !== "");

  useEffect(() => {
    if (token === "") {
      return;
    }
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
      setText(["Opened game on Lichess"]);
    } catch (error) {
      page?.close();
      console.error("Unable to import game to Lichess", error);
      setText(["Unable to open game on Lichess", describeLichessError(error)]);
    }
  }

  const exportToStudy = async (study: Study) => {
    const name = createName();
    try {
      await lichessImportPgnToStudy(token, pgn, name, study.id);
      setText(["Exported game to", `"${study.name}/${name}"`]);
    } catch (error) {
      console.error("Unable to export game to Lichess study", error);
      setText(["Unable to export game to Lichess study", describeLichessError(error)]);
    }
  }

  const copyPgn = () => {
    void navigator.clipboard.writeText(pgn)
      .then(() => setText(["Copied PGN"]))
      .catch((error: unknown) => {
        console.error("Unable to copy PGN", error);
        setText(["Unable to copy PGN"]);
      });
  }

  const studyItems = () => {
    if (loadError !== null) {
      return <DropdownText>{loadError}</DropdownText>;
    }
    if (studies.length === 0) {
      return <DropdownText>No studies found</DropdownText>;
    }
    return studies.map(study =>
      <DropdownItem key={study.id} onClick={() => { void exportToStudy(study); }}>
        {study.name}
      </DropdownItem>
    );
  }

  // Logging in reloads the page, and only the login outlives a reload, so a game in progress would be lost
  const loginItems = () => {
    if (game.moves === "") {
      return (
        <DropdownItem onClick={() => { void lichessLogin(pathname); }}>Log in with Lichess</DropdownItem>
      );
    }
    return (<>
      <DropdownText>
        <span className="block max-w-56 text-sm opacity-75">
          Logging in leaves this page, so this game will be lost. Copy the PGN first to keep it.
        </span>
      </DropdownText>
      <DropdownItem onClick={copyPgn}>Copy PGN</DropdownItem>
      <DropdownItem onClick={() => { void lichessLogin(pathname); }}>Log in anyway</DropdownItem>
    </>);
  }

  return (
    <Dropdown label="Lichess" title="Send the game to Lichess">
      <DropdownItem onClick={() => { void openInLichess(); }}>Open in Lichess</DropdownItem>
      <Divider />
      <MenuHeading>Add to a study</MenuHeading>
      {loggedIn ? studyItems() : loginItems()}
      {loggedIn && (<>
        <Divider />
        <DropdownItem onClick={() => { void lichessLogout(token); }}>Log out ({username})</DropdownItem>
      </>)}
    </Dropdown>
  );
};

export default ExportButton;
