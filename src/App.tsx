import { useEffect, useRef } from "react";
import { type NavigateFunction, Outlet, useNavigate } from "react-router";
import type { CompiledModel } from "@litertjs/core";
import type { ModelRefs } from "./types";
import { useUser } from "./slices/userSlice";
import { describeLichessError, lichessTrySetUser } from "./api/lichess";
import { Toast } from "./components/common";
import { errorShow } from "./slices/errorSlice";

const App = () => {
  const navigate: NavigateFunction = useNavigate();
  const token = useUser().token;
  const chessqueriesModelRef = useRef<CompiledModel | null>(null);
  const modelRefs: ModelRefs = {
    chessqueriesModelRef,
  }

  useEffect(() => {
    if (token === "") {
      void lichessTrySetUser(navigate)
        .catch((error: unknown) => {
          console.error("Failed to log in to Lichess", error);
          errorShow({ source: "login", message: `Unable to log in to Lichess. ${describeLichessError(error)}` });
        });
    }
  }, [navigate, token]);

  return (
    <>
      <Toast />
      <Outlet context={modelRefs} />
    </>
  );
};

export default App;
