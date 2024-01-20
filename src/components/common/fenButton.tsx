import { useState } from "react";
import { findFen } from "../../utils/findFen";
import { useDispatch } from 'react-redux';
import { gameResetFen, gameResetMoves, gameResetStart } from "../../slices/gameSlice";
import { Color } from "chess.js";

const FenButton = ({ piecesModelRef, videoRef, canvasRef, setText, cornersRef }: 
  {piecesModelRef: any, videoRef: any, canvasRef: any, setText: any, cornersRef: any }) => {
  const options = ["Normal", "Infer (White to move)", "Infer (Black to move)"];
  
  const dispatch = useDispatch();
  const [option, setOption] = useState<string>(options[0]);

  const handleClick = (e: any, option: string) => {
    e.preventDefault();
    if (option === "Normal") {
      dispatch(gameResetStart());
      dispatch(gameResetMoves());
      dispatch(gameResetFen());
    } else {
      const color: Color = option.includes("White to move") ? "w" : "b";
      findFen(piecesModelRef, videoRef, cornersRef, canvasRef, dispatch, setText, color);
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
            <a onClick={(e) => handleClick(e, option)} className="dropdown-item" href="#">{option}</a>
          </li>
        )}
      </ul>
    </div>
  );
};

export default FenButton;