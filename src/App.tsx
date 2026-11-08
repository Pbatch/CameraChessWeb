import i18n from "./i18n";
import { useEffect, useRef } from "react";
import { type NavigateFunction, Outlet, useNavigate } from "react-router";
import type { Chessqueries, ModelRefs } from "./types";
import { useUser } from "./slices/userSlice";
import { describeLichessError, lichessTrySetUser } from "./api/lichess";
import { Toast } from "./components/common";
import { useHelpOpen } from "./components/faq/faqPanel";
import Header from "./components/common/header";
import FaqPanel from "./components/faq/faqPanel";
import { errorShow } from "./slices/errorSlice";

const App = () => {
  const helpOpen: boolean = useHelpOpen();
  const navigate: NavigateFunction = useNavigate();
  const token = useUser().token;
  const chessqueriesModelRef = useRef<Chessqueries | null>(null);
  const modelRefs: ModelRefs = {
    chessqueriesModelRef,
  }

  useEffect(() => {
    if (token === "") {
      void lichessTrySetUser(navigate)
        .catch((error: unknown) => {
          console.error("Failed to log in to Lichess", error);
          errorShow({ source: "login", message: i18n.t("lichess.signInFailed", { reason: describeLichessError(error) }) });
        });
    }
  }, [navigate, token]);

  return (
    <div className="flex h-full flex-col">
      {/* While the FAQ is open, errors show in it, as nothing outside an open dialog can be seen above it */}
      {!helpOpen && <Toast />}
      <Header />
      <FaqPanel />
      {/* Each page fills the height left below the header */}
      <div className="min-h-0 flex-1">
        <Outlet context={modelRefs} />
      </div>
    </div>
  );
};

export default App;
