import { useState } from "react";
import { findFen } from "../../utils/findFen";
import { useDispatch } from 'react-redux';
import { gameResetFen, gameResetMoves, gameResetStart } from "../../slices/gameSlice";
import { Color } from "chessops/types";

const FenButton = ({ piecesModelRef, videoRef, canvasRef, setText, cornersRef }:
  { piecesModelRef: any, videoRef: any, canvasRef: any, setText: any, cornersRef: any }) => {
  const options = ["Normal", "Infer (White to move)", "Infer (Black to move)"];

  const dispatch = useDispatch();
  const [option, setOption] = useState<string>(options[0]);

  const handleClick = (option: string) => {
    if (option === "Normal") {
      dispatch(gameResetStart());
      dispatch(gameResetMoves());
      dispatch(gameResetFen());
    } else {
      const color: Color = option.includes("White to move") ? "white" : "black";
      void findFen({ piecesModelRef, videoRef, cornersRef, canvasRef, dispatch, setText, color })
        .catch((error: unknown) => {
          console.error("Unable to infer the starting position", error);
          setText(["Unable to infer the starting position"]);
        });
    }
    setOption(option);
  }

  return (
    <div className="dropdown">
      <button className="btn btn-dark btn-sm btn-outline-light dropdown-toggle w-100" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
        Start: {option}
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
