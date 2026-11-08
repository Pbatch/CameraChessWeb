import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";
import Icon from "./icon";
import { useStore } from "../../store";

// How long a reset waits for its confirming second press, in ms
const CONFIRM_FOR = 3000;

// The reset in the controls over the video. With moves in the game it asks for a second press, as a reset loses
// them; `onPress` runs on every press, e.g. to keep the controls showing.
const ResetButton = ({ label, onReset, onPress }: {
  label: string,
  onReset: () => void,
  onPress?: () => void
}) => {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleClick = () => {
    onPress?.();
    window.clearTimeout(timer.current);
    if (!confirming && useStore.getState().game.moves !== "") {
      setConfirming(true);
      timer.current = window.setTimeout(() => setConfirming(false), CONFIRM_FOR);
      return;
    }
    setConfirming(false);
    onReset();
  };

  const title = confirming ? t("reset.confirmTitle") : label;

  return (
    <button type="button" className={`video-controls__button${confirming ? " video-controls__button--confirm" : ""}`}
      onClick={handleClick} aria-label={title} title={title}>
      <Icon icon={Eraser} />
      {confirming && <span className="ms-1.5 text-sm font-semibold">{t("reset.confirm")}</span>}
    </button>
  );
};

export default ResetButton;
