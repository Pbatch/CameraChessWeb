import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation, useOutletContext } from "react-router";
import { MODE_NAMES, useRouteMode } from "../../utils/modes";
import type { ModelRefs } from "../../types";
import { useUser } from "../../slices/userSlice";
import { lichessLogin } from "../../api/lichess";
import buttonClass from "./buttonClass";

// Why each mode that acts on Lichess needs the account
const REASONS = { play: "lichess.playReason", broadcast: "lichess.broadcastReason" } as const;

// Asks for a Lichess login before the routes that act as the user, and before the model loads or the camera
// starts, so nobody is asked for the camera and then sent off to Lichess
const RequireLichess = () => {
  const modelRefs = useOutletContext<ModelRefs>();
  const { pathname } = useLocation();
  const mode = useRouteMode();
  const token = useUser().token;
  const { t } = useTranslation();

  if (token !== "") {
    return <Outlet context={modelRefs} />;
  }

  const title = (mode !== null) ? MODE_NAMES[mode] : "lichess.title";
  const reason = (mode === "play" || mode === "broadcast") ? REASONS[mode] : "lichess.needsAccount";
  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 overflow-auto bg-dark p-4 text-center
      text-white">
      <h1 className="text-3xl font-medium">{t(title)}</h1>
      <p className="max-w-sm opacity-75">{t(reason)}</p>
      {/* Back here once logged in */}
      <button type="button" className={buttonClass("light", "lg")} onClick={() => { void lichessLogin(pathname); }}>
        {t("common.signInLichess")}
      </button>
      <Link to="/" className="underline-offset-4 opacity-75 hover:underline hover:opacity-100">{t("common.backHome")}</Link>
    </main>
  );
};

export default RequireLichess;
