import SidebarButton from "./sidebarButton";
import type { Roi, SetBoolean, SetRoi } from "../../types";

const RoiButton = ({ roi, setRoi, selecting, setSelecting, canPlay }: {
  roi: Roi | null,
  setRoi: SetRoi,
  selecting: boolean,
  setSelecting: SetBoolean,
  canPlay: boolean
}) => {
  const handleClick = () => {
    if (selecting) {
      setSelecting(false);
    } else if (roi !== null) {
      setRoi(null);
    } else {
      setSelecting(true);
    }
  }

  let label: string = "Draw Region";
  let title: string = "Draw a region around the board";
  if (selecting) {
    label = "Drag a box (cancel)";
    title = "Cancel drawing the region";
  } else if (roi !== null) {
    label = "Clear Region";
    title = "Clear the region and use the full frame";
  }

  return (
    <SidebarButton onClick={handleClick} disabled={!canPlay} aria-label={title} title={title}>
      {label}
    </SidebarButton>
  );
};

export default RoiButton;
