import { useEffect, useState } from "react";
import { useGame } from "../../slices/gameSlice";
import type { Game } from "../../types";

const Toast = () => {
  const game: Game = useGame();
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => {
      setShow(false);
    }, 300);
  };

  useEffect(() => {
    if (game.error) {
      setShow(true);
      setVisible(true);
    }
  }, [game.error]);

  if (!show || !game.error) return null;

  return (
    <div
      className="position-fixed top-0 end-0 m-3"
      style={{ zIndex: 9999 }}
    >
      <div
        className="toast show"
        role="alert"
        style={{
          backgroundColor: "#dc3545",
          color: "white",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      >
        <div className="toast-body d-flex justify-content-between align-items-center">
          {game.error}
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={dismiss}
            aria-label="Dismiss error"
            title="Dismiss error"
            style={{ filter: "invert(1)" }}
          />
        </div>
      </div>
    </div>
  );
};

export default Toast;
