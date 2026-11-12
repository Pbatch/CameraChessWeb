import i18n from "../../i18n";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Outlet, useOutletContext } from "react-router";
import type { ModelRefs } from "../../types";
import { loadPieceModelOnce } from "../../vision/pieceModel";

// Holds back the routes that read the board until the model has loaded, so other pages don't wait for it
const ModelLoader = () => {
  const { t } = useTranslation();
  const modelRefs = useOutletContext<ModelRefs>();
  const { modelRef } = modelRefs;
  const [loading, setLoading] = useState(modelRef.current === null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadPieceModelOnce(modelRef)
      .then(() => setLoading(false))
      .catch((error: unknown) => {
        console.error("Failed to load models", error);
        setLoadError((error instanceof Error)
          ? i18n.t("common.modelFailedReason", { reason: error.message })
          : i18n.t("common.modelFailed"));
      });
  }, [modelRef]);

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
          <span>{t("common.loadingModel")}</span>
        </div>
      </main>
    );
  }

  return <Outlet context={modelRefs} />;
};

export default ModelLoader;
