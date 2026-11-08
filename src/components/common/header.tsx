import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { CircleHelp, Cpu, Globe, LogOut, MonitorPlay, UserRound } from "lucide-react";
import Dropdown, { DropdownCheckItem, DropdownDivider, DropdownHeading, DropdownItem, DropdownText } from "./dropdown";
import { useUser } from "../../slices/userSlice";
import { engineChoiceClear, engineToggle, useEngineOn } from "../../slices/engineSlice";
import { useDetecting } from "../../slices/detectingSlice";
import { useGame } from "../../slices/gameSlice";
import { lichessLogout } from "../../api/lichess";
import { LANGUAGES, setLanguage } from "../../i18n";
import type { Language } from "../../i18n";
import type { Mode } from "../../types";
import { HELP_STATE } from "../faq/faqPanel";
import SignInItems from "./signInItems";
import { MODE_NAMES, useRouteMode } from "../../utils/modes";

// The "How to use ChessCam" playlist, with a short video for each mode
const VIDEO_GUIDES = "https://www.youtube.com/playlist?list=PLZyXLojfJ2OU";

const useLanguage = (): Language => {
  const { i18n } = useTranslation();
  return (i18n.resolvedLanguage ?? "en") as Language;
};

// Each language in its own name, ticked when it's the one showing
const LanguageItems = () => {
  const language = useLanguage();
  return (<>
    {(Object.entries(LANGUAGES) as [Language, string][]).map(([code, name]) =>
      <DropdownCheckItem key={code} kind="radio" lang={code} checked={code === language}
        onClick={() => setLanguage(code)}>
        {name}
      </DropdownCheckItem>
    )}
  </>);
};

// The language on its own, beside the account, so it can be found without signing in or opening the account menu
const LanguageMenu = () => {
  const { t } = useTranslation();
  const language = useLanguage();
  return (
    <Dropdown icon={Globe} caret={false} align="end" className="shrink-0" label={language.toUpperCase()}
      title={t("common.language")} buttonClassName="app-header__button app-header__language">
      <LanguageItems />
    </Dropdown>
  );
};

// The Lichess account, as on Lichess's own header: the username (or "Sign in"), and a menu of settings and signing in
// or out
const AccountMenu = () => {
  const { t } = useTranslation();
  const { token, username } = useUser();
  const { pathname } = useLocation();
  // A mode's page has a game on it, which signing in (leaving for Lichess) would lose
  const mode: Mode | null = useRouteMode();
  const engineOn: boolean = useEngineOn(mode);
  const { moves } = useGame();
  const gameInProgress: boolean = (mode !== null) && (moves !== "");
  const signedIn: boolean = (token !== "");
  // Signing out mid-game would stop a broadcast or a Lichess game, so it waits for a pause
  const detecting: boolean = useDetecting();
  // Play and broadcast show only a sign-in prompt until signed in, where the engine switch would do nothing
  const gamePage: boolean = (mode === "upload") || (mode === "record") || ((mode !== null) && signedIn);
  const navigate = useNavigate();

  // A switch made in the menu lasts for the visit to that mode, so the next starts from its default. Here rather than
  // in the mode's page, as the switch also shows while that page is loading, and the header is always there.
  useEffect(() => {
    return () => { if (mode !== null) engineChoiceClear(mode); };
  }, [mode]);
  // The FAQ, over the page, so a game, the camera or a loaded video stay as they are
  const openHelp = () => {
    void navigate(pathname, { state: HELP_STATE });
  };

  return (
    <Dropdown icon={UserRound} iconAfter={true} caret={false} align="end" className="min-w-0"
      label={signedIn ? username : t("account.signIn")}
      title={signedIn ? `${username} · ${t("account.menu")}` : t("account.menu")}
      buttonClassName="app-header__button app-header__account">
      {/* Only on a page with a game. Play mode never shows the engine, as it would help in a live Lichess game. */}
      {gamePage && (mode === "play") && (<>
        <DropdownHeading icon={Cpu}>{t("account.engine")}</DropdownHeading>
        <DropdownText><span className="block max-w-56 text-sm opacity-75">{t("account.engineNotInPlay")}</span></DropdownText>
        <DropdownDivider />
      </>)}
      {gamePage && (mode !== null) && (mode !== "play") && (<>
        <DropdownCheckItem icon={Cpu} look="switch" checked={engineOn} onClick={() => engineToggle(mode)}>
          {t("account.engine")}
        </DropdownCheckItem>
        <DropdownDivider />
      </>)}
      <DropdownItem icon={CircleHelp} onClick={openHelp}>{t("account.help")}</DropdownItem>
      {/* In a new tab, so the game stays */}
      <DropdownItem icon={MonitorPlay} onClick={() => { window.open(VIDEO_GUIDES, "_blank", "noopener"); }}>
        {t("account.videoGuides")}
      </DropdownItem>
      <DropdownDivider />
      {signedIn ? (<>
        <DropdownItem icon={LogOut} disabled={detecting} onClick={() => { void lichessLogout(token); }}>
          {t("account.signOut")}
        </DropdownItem>
        {detecting && <DropdownText><span className="block text-sm opacity-75">{t("account.pauseToSignOut")}</span></DropdownText>}
      </>) : <SignInItems returnTo={pathname} gameInProgress={gameInProgress} />}
    </Dropdown>
  );
};

// A row across the top of every page, as on Lichess: the logo and name on the left, which go home, the mode in the
// middle, and the language and the account on the right
const Header = () => {
  const { t } = useTranslation();
  const mode: Mode | null = useRouteMode();

  return (
    <header className="app-header">
      <div className="app-header__start">
        <Link to="/" className="app-header__button app-header__home" aria-label={t("common.goHome")}
          title={t("common.goHome")}>
          <img src="/favicon.ico" alt="" className="size-6" />
          {/* A wordmark, as Lichess's "lichess.org", so it isn't translated */}
          <span className="app-header__wordmark" translate="no">Chesscam<span className="app-header__tld">.net</span></span>
        </Link>
      </div>
      {/* Centred on the page, whatever is either side */}
      <div className="app-header__title">{(mode !== null) && t(MODE_NAMES[mode])}</div>
      <div className="app-header__end">
        <LanguageMenu />
        <AccountMenu />
      </div>
    </header>
  );
};

export default Header;
