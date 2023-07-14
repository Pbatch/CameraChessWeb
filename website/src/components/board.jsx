import { Chessboard } from 'kokopu-react';
import { useEffect, useState } from "react";

const Board = ({ fen }) => {
  return (
    <Chessboard position={fen} coordinateVisible={false} squareSize={50}/>
  );
}

export default Board;