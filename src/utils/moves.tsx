import { Chess, Move } from "chess.js";
import { SQUARE_MAP, LABEL_MAP } from "./constants";
import { MovesData, MovesPair } from "../types";

const castlingMap: {[id: string]: number[]} = {
  "g1": [SQUARE_MAP["h1"], SQUARE_MAP["f1"], LABEL_MAP["R"]],
  "c1": [SQUARE_MAP["a1"], SQUARE_MAP["d1"], LABEL_MAP["R"]],
  "g8": [SQUARE_MAP["h8"], SQUARE_MAP["f8"], LABEL_MAP["r"]],
  "c8": [SQUARE_MAP["a8"], SQUARE_MAP["d8"], LABEL_MAP["r"]]
}

const getPieceIdx = (move: Move) => {
  let piece: string = move.piece;
  if (move?.promotion) {
    piece = move.promotion;
  }
  if (move.color == "w") {
    piece = piece.toUpperCase();
  }
  const pieceIdx: number = LABEL_MAP[piece];
  return pieceIdx;
}

const getData = (move: Move) => {
  const fromSquares: number[] = [SQUARE_MAP[move.from]];
  const toSquares = [SQUARE_MAP[move.to]];
  const targets = [getPieceIdx(move)];
  if (move.isKingsideCastle() || move.isQueensideCastle()) {
    const [from, to, target] = castlingMap[move.to];
    fromSquares.push(from);
    toSquares.push(to);
    targets.push(target);
  } else if (move.isEnPassant()) {
    const capturedPawnSquare = SQUARE_MAP[move.to[0] + move.from[1]];
    fromSquares.push(capturedPawnSquare);
  }
  const moveData: MovesData = {
    "sans": [move.san],
    "from": fromSquares,
    "to": toSquares,
    "targets": targets
  }
  return moveData;
}

const combineData = (move1Data: MovesData, move2Data: MovesData) => {
  const badSquares = move2Data.from.concat(move2Data.to);
  const from1 = move1Data.from.filter(x => !badSquares.includes(x));

  const to1 = [];
  const targets1 = [];
  for (let i = 0; i < move1Data.to.length; i++) {
    if (badSquares.includes(move1Data.to[i])) {
      continue;
    }
    to1.push(move1Data.to[i]);
    targets1.push(move1Data.targets[i]);
  }

  const from = from1.concat(move2Data.from);
  const to = to1.concat(move2Data.to);
  const targets = targets1.concat(move2Data.targets);
  
  const data: MovesData = {
    "sans": [move1Data.sans[0], move2Data.sans[0]],
    "from": from,
    "to": to,
    "targets": targets
  }
  return data;
}

export const getMovesPairs = (board: Chess) => {
  const movesPairs: MovesPair[] = [];
  board.moves({ verbose: true }).forEach(move1 => {
    const move1Data = getData(move1);
    board.move(move1);
    let done = true;
    board.moves({ verbose: true }).forEach(move2 => {
      const move2Data = getData(move2);
      const movesData = combineData(move1Data, move2Data);
      const movesPair: MovesPair = {
        "move1": move1Data,
        "move2": move2Data,
        "moves": movesData           
      }
      movesPairs.push(movesPair);
      done = false;
    });
    if (done) {
      const movesPair: MovesPair = {
        "move1": move1Data,
        "move2": null,
        "moves": null
      }
      movesPairs.push(movesPair);
    }
    board.undo();
  });
  return movesPairs;
}