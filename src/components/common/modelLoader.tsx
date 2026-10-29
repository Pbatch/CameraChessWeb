import { useEffect, useState } from "react";
import { Outlet, useOutletContext } from "react-router";
import type { ModelRefs } from "../../types";
import { loadChessqueriesOnce } from "../../vision/chessqueries";

// Holds back the routes that read the board until the model has loaded, so other pages don't wait for it
const ModelLoader = () => {
  const modelRefs = useOutletContext<ModelRefs>();
  const { chessqueriesModelRef } = modelRefs;
  const [loading, setLoading] = useState(chessqueriesModelRef.current === null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadChessqueriesOnce(chessqueriesModelRef)
      .then(() => setLoading(false))
      .catch((error: unknown) => {
        console.error("Failed to load models", error);
        const reason: string = (error instanceof Error) ? ` (${error.message})` : "";
        setLoadError(`ChessCam could not load its board-recognition model${reason}. Please reload and try again.`);
      });
  }, [chessqueriesModelRef]);

  if (loadError !== null) {
    return (
      <main className="d-flex h-100 align-items-center justify-content-center bg-dark text-white p-3">
        <p className="m-0 text-center" role="alert">{loadError}</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main
        className="d-flex h-100 align-items-center justify-content-center bg-dark text-white p-3"
        aria-busy="true"
      >
        <div className="d-flex align-items-center gap-2" role="status" aria-live="polite">
          <span className="spinner-border" aria-hidden="true" />
          <span>Loading FEN model...</span>
        </div>
      </main>
    );
  }

  return <Outlet context={modelRefs} />;
};

export default ModelLoader;
