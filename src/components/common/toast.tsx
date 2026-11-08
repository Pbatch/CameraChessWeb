import { useTranslation } from "react-i18next";
import { useState } from "react";
import { errorClear, useLatestError } from "../../slices/errorSlice";
import type { AppError } from "../../types";
import { X } from "lucide-react";
import Icon from "./icon";

const Toast = () => {
  const { t } = useTranslation();
  const error: AppError | null = useLatestError();
  // The error fading out, which is cleared once the fade ends
  const [hiding, setHiding] = useState<AppError | null>(null);

  if (error === null) return null;

  const dismiss = () => {
    setHiding(error);
    setTimeout(() => {
      errorClear(error.source);
      setHiding(null);
    }, 300);
  };

  return (
    <div className={`error-toast fixed end-0 top-(--header-height) z-9999 m-4 transition-opacity duration-300${(hiding === error) ? " opacity-0" : ""}`}>
      <div className="flex w-[350px] max-w-[calc(100vw-2rem)] items-center justify-between gap-2 rounded-md bg-danger p-3 text-sm text-white shadow-lg"
        role="alert">
        {error.message}
        <button
          type="button"
          className="shrink-0 rounded p-1 leading-none opacity-50 hover:opacity-75 focus-visible:opacity-100 focus-visible:ring-4 focus-visible:ring-white/25 focus-visible:outline-none"
          onClick={dismiss}
          aria-label={t("common.dismissError")}
          title={t("common.dismissError")}
        >
          <Icon icon={X} className="" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
