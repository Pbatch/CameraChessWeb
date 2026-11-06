import { Link, Outlet, useLocation, useOutletContext } from "react-router";
import type { ModelRefs } from "../../types";
import { useUser } from "../../slices/userSlice";
import { lichessLogin } from "../../api/lichess";
import buttonClass from "./buttonClass";

const MODES: Record<string, { title: string, reason: string }> = {
  "/play": {
    title: "Play",
    reason: "ChessCam plays the moves you make on your board in your Lichess games, so it needs your Lichess account.",
  },
  "/broadcast": {
    title: "Broadcast",
    reason: "ChessCam streams the game on your board to one of your Lichess broadcasts, so it needs your Lichess account.",
  },
};

// Asks for a Lichess login before the routes that act as the user, and before the model loads or the camera
// starts, so nobody is asked for the camera and then sent off to Lichess
const RequireLichess = () => {
  const modelRefs = useOutletContext<ModelRefs>();
  const { pathname } = useLocation();
  const token = useUser().token;

  if (token !== "") {
    return <Outlet context={modelRefs} />;
  }

  const { title, reason } = MODES[pathname] ?? { title: "Lichess", reason: "This needs your Lichess account." };
  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 overflow-auto bg-dark p-4 text-center
      text-white">
      <h1 className="text-3xl font-medium">{title}</h1>
      <p className="max-w-sm opacity-75">{reason}</p>
      {/* Back here once logged in */}
      <button type="button" className={buttonClass("light", "lg")} onClick={() => { void lichessLogin(pathname); }}>
        Log in with Lichess
      </button>
      <Link to="/" className="underline-offset-4 opacity-75 hover:underline hover:opacity-100">Back to home</Link>
    </main>
  );
};

export default RequireLichess;
