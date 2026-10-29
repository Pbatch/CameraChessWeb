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
      <main className="flex h-full items-center justify-center bg-dark p-4 text-white">
        <p className="text-center" role="alert">{loadError}</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main
        className="flex h-full items-center justify-center bg-dark p-4 text-white"
        aria-busy="true"
      >
        <div className="flex items-center gap-2" role="status" aria-live="polite">
          <span className="inline-block size-8 animate-spin rounded-full border-4 border-current border-e-transparent"
            aria-hidden="true" />
          <span>Loading FEN model...</span>
        </div>
      </main>
    );
  }

  return <Outlet context={modelRefs} />;
};

export default ModelLoader;
