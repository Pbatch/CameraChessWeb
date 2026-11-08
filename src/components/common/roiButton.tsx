import { useTranslation } from "react-i18next";
import SidebarButton from "./sidebarButton";
import { SquareDashed } from "lucide-react";
import Icon from "./icon";
import type { Roi, SetBoolean, SetRoi } from "../../types";

const RoiButton = ({ roi, setRoi, selecting, setSelecting, canPlay }: {
  roi: Roi | null,
  setRoi: SetRoi,
  selecting: boolean,
  setSelecting: SetBoolean,
  canPlay: boolean
}) => {
  const { t } = useTranslation();

  const handleClick = () => {
    if (selecting) {
      setSelecting(false);
    } else if (roi !== null) {
      setRoi(null);
    } else {
      setSelecting(true);
    }
  }

  let label: string = t("region.draw");
  let title: string = t("region.drawTitle");
  if (selecting) {
    label = t("region.drawing");
    title = t("region.drawingTitle");
  } else if (roi !== null) {
    label = t("region.clear");
    title = t("region.clearTitle");
  }

  return (
    <SidebarButton onClick={handleClick} disabled={!canPlay} aria-label={title} title={title}>
      <Icon icon={SquareDashed} className="me-2" />
      {label}
    </SidebarButton>
  );
};

export default RoiButton;
