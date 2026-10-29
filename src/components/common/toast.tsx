import { useState } from "react";
import { errorClear, useLatestError } from "../../slices/errorSlice";
import type { AppError } from "../../types";

const Toast = () => {
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
    <div className={`error-toast${(hiding === error) ? " error-toast--hidden" : ""} position-fixed top-0 end-0 m-3`}>
      <div className="toast show text-bg-danger" role="alert">
        <div className="toast-body d-flex justify-content-between align-items-center">
          {error.message}
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={dismiss}
            aria-label="Dismiss error"
            title="Dismiss error"
          />
        </div>
      </div>
    </div>
  );
};

export default Toast;
