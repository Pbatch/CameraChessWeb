import { Chessboard } from "kokopu-react";
import { Game } from "../../types";
import { gameSelect } from "../../slices/gameSlice";

const BoardDisplay = ({playing}: {playing: boolean}) => {
  const liStyle = {
    display: playing ? "inline-block": "none"
  }
  const game: Game = gameSelect();
  return (
    <li className="my-1" style={liStyle}>
      <Chessboard 
        turnVisible={false} 
        squareSize={20} 
        position={game.fen}
        coordinateVisible={false}
      />
    </li>
  );
};

export default BoardDisplay;