import { useState } from "react";
import { findFen } from "../../vision/findFen";
import { useDispatch } from 'react-redux';
import { gameResetFen, gameResetMoves, gameResetStart } from "../../slices/gameSlice";
import type { Color } from "chessops/types";
import type { ModelRefs, Roi, SetStringArray, VideoRef } from "../../types";

const FenButton = ({ chessqueriesModelRef, videoRef, roi, setText, canPlay }:
  Pick<ModelRefs, "chessqueriesModelRef"> & {
    videoRef: VideoRef,
    roi: Roi | null,
    setText: SetStringArray,
    canPlay: boolean
  }) => {
  const options = ["Standard", "Detect (White to move)", "Detect (Black to move)"];

  const dispatch = useDispatch();
  const [option, setOption] = useState<string>(options[0]);

  const handleClick = (option: string) => {
    if (option === "Standard") {
      dispatch(gameResetStart());
      dispatch(gameResetMoves());
      dispatch(gameResetFen());
    } else {
      const color: Color = option.includes("White to move") ? "white" : "black";
      void findFen({ chessqueriesModelRef, videoRef, roi, dispatch, setText, color })
        .catch((error: unknown) => {
          console.error("Unable to infer the starting position", error);
          setText(["Unable to infer the starting position"]);
        });
    }
    setOption(option);
  }

  return (
    <div className="dropdown">
      <button type="button" className="btn btn-dark btn-sm btn-outline-light dropdown-toggle w-100" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false"
        disabled={!canPlay}>
        Position: {option}
      </button>
      <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
        {options.map((option) =>
          <li key={option}>
            <button type="button" onClick={() => handleClick(option)} className="dropdown-item">{option}</button>
          </li>
        )}
      </ul>
    </div>
  );
};

export default FenButton;
