import { useEffect } from "react";
import { useRouteError } from "react-router";
import { clearSavedState } from "../../store";
import buttonClass from "./buttonClass";

// Shown instead of the app when rendering throws
const ErrorPage = () => {
  const error: unknown = useRouteError();

  useEffect(() => {
    console.error("ChessCam crashed", error);
  }, [error]);

  const reset = () => {
    clearSavedState();
    location.assign("/");
  }

  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 bg-dark p-4 text-center text-white">
      <h1 className="text-2xl/[1.2] font-medium">Something went wrong</h1>
      <p role="alert">
        {(error instanceof Error) ? error.message : "ChessCam hit an unexpected error."}
      </p>
      <p>If reloading does not help, clearing the saved data should. This also logs you out of Lichess.</p>
      <div className="flex gap-2">
        <button type="button" className={buttonClass("light")} onClick={() => location.reload()}>Reload</button>
        <button type="button" className={buttonClass()} onClick={reset}>Clear saved data</button>
      </div>
    </main>
  );
};

export default ErrorPage;
