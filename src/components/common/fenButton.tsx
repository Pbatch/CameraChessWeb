import { useState } from "react";
import { findFen } from "../../vision/findFen";
import { gameReset } from "../../slices/gameSlice";
import type { Color } from "chessops/types";
import type { ModelRefs, Roi, SetStringArray, VideoRef } from "../../types";
import { Grid3x3 } from "lucide-react";
import Dropdown, { DropdownItem } from "./dropdown";

const FenButton = ({ chessqueriesModelRef, videoRef, roi, setText, canPlay }:
  Pick<ModelRefs, "chessqueriesModelRef"> & {
    videoRef: VideoRef,
    roi: Roi | null,
    setText: SetStringArray,
    canPlay: boolean
  }) => {
  const options = ["Standard", "Detect (White to move)", "Detect (Black to move)"];
  const [option, setOption] = useState<string>(options[0]);

  const handleClick = (option: string) => {
    if (option === "Standard") {
      gameReset();
    } else {
      const color: Color = option.includes("White to move") ? "white" : "black";
      void findFen({ chessqueriesModelRef, videoRef, roi, setText, color })
        .catch((error: unknown) => {
          console.error("Unable to infer the starting position", error);
          setText(["Unable to infer the starting position"]);
        });
    }
    setOption(option);
  }

  return (
    <Dropdown icon={Grid3x3} label={`Position: ${option}`} disabled={!canPlay}>
      {options.map((option) =>
        <DropdownItem key={option} onClick={() => handleClick(option)}>{option}</DropdownItem>
      )}
    </Dropdown>
  );
};

export default FenButton;
