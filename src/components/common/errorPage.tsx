import { useEffect } from "react";
import { useRouteError } from "react-router";
import { clearSavedState } from "../../store";

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
    <main className="d-flex flex-column h-100 align-items-center justify-content-center gap-3 bg-dark text-white p-3 text-center">
      <h1 className="h4 m-0">Something went wrong</h1>
      <p className="m-0" role="alert">
        {(error instanceof Error) ? error.message : "ChessCam hit an unexpected error."}
      </p>
      <p className="m-0">If reloading does not help, clearing the saved data should. This also logs you out of Lichess.</p>
      <div className="d-flex gap-2">
        <button type="button" className="btn btn-light" onClick={() => location.reload()}>Reload</button>
        <button type="button" className="btn btn-outline-light" onClick={reset}>Clear saved data</button>
      </div>
    </main>
  );
};

export default ErrorPage;
