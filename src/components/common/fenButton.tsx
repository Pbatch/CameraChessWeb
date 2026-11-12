import { useTranslation } from "react-i18next";
import { useState } from "react";
import { findFen } from "../../vision/findFen";
import { gameReset } from "../../slices/gameSlice";
import type { Color } from "@chesscam/recorder";
import type { ModelRefs, Roi, SetStringArray, VideoRef } from "../../types";
import { Grid3x3 } from "lucide-react";
import Dropdown, { DropdownItem } from "./dropdown";

// The starting position: the standard one, or one read from the camera with a side to move
const OPTIONS = {
  standard: "position.standard",
  white: "position.detectWhite",
  black: "position.detectBlack",
} as const;
type Option = keyof typeof OPTIONS;

const FenButton = ({ modelRef, videoRef, roi, setText, canPlay }:
  Pick<ModelRefs, "modelRef"> & {
    videoRef: VideoRef,
    roi: Roi | null,
    setText: SetStringArray,
    canPlay: boolean
  }) => {
  const { t } = useTranslation();
  const [option, setOption] = useState<Option>("standard");

  const handleClick = (option: Option) => {
    if (option === "standard") {
      gameReset();
    } else {
      const color: Color = option;
      void findFen({ modelRef, videoRef, roi, setText, color })
        .catch((error: unknown) => {
          console.error("Unable to infer the starting position", error);
          setText([t("position.detectFailed")]);
        });
    }
    setOption(option);
  }

  return (
    <Dropdown icon={Grid3x3} label={t("position.label", { option: t(OPTIONS[option]) })} disabled={!canPlay}>
      {(Object.keys(OPTIONS) as Option[]).map((option) =>
        <DropdownItem key={option} onClick={() => handleClick(option)}>{t(OPTIONS[option])}</DropdownItem>
      )}
    </Dropdown>
  );
};

export default FenButton;
