import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useRouteError } from "react-router";
import { clearSavedState } from "../../store";
import buttonClass from "./buttonClass";

// Shown instead of the app when rendering throws
const ErrorPage = () => {
  const error: unknown = useRouteError();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("ChessCam crashed", error);
  }, [error]);

  const reset = () => {
    clearSavedState();
    location.assign("/");
  }

  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 bg-dark p-4 text-center text-white">
      <h1 className="text-2xl/[1.2] font-medium">{t("errorPage.title")}</h1>
      <p role="alert">
        {(error instanceof Error) ? error.message : t("errorPage.unexpected")}
      </p>
      <p>{t("errorPage.help")}</p>
      <div className="flex gap-2">
        <button type="button" className={buttonClass("light")} onClick={() => location.reload()}>{t("errorPage.reload")}</button>
        <button type="button" className={buttonClass()} onClick={reset}>{t("errorPage.clearData")}</button>
      </div>
    </main>
  );
};

export default ErrorPage;
