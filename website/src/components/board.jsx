import { Chessboard } from 'kokopu-react';

const Board = ({fen}) => {

  return (
    <Chessboard squareSize={20} position={fen} />
  );
}

export default Board;