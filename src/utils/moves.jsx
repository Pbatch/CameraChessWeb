import { SQUARE_MAP, LABEL_MAP } from "./constants.jsx";

const castlingMap = {
  "g1": [SQUARE_MAP["h1"], SQUARE_MAP["f1"], LABEL_MAP["R"]],
  "c1": [SQUARE_MAP["a1"], SQUARE_MAP["d1"], LABEL_MAP["R"]],
  "g8": [SQUARE_MAP["h8"], SQUARE_MAP["f8"], LABEL_MAP["r"]],
  "c8": [SQUARE_MAP["a8"], SQUARE_MAP["d8"], LABEL_MAP["r"]]
}

const getPieceIdx = (move) => {
  let piece = move.piece;
  if (move.flags.includes("p")) {
    piece = move.promotion;
  }
  if (move.color == "w") {
    piece = piece.toUpperCase();
  }
  const pieceIdx = LABEL_MAP[piece];
  return pieceIdx;
}

const getData = (move) => {
  let fromSquares = [SQUARE_MAP[move.from]];
  let toSquares = [SQUARE_MAP[move.to]];
  let targets = [getPieceIdx(move)];
  if ((move.flags.includes("k")) | (move.flags.includes("q"))) {
    // Castling
    const [from, to, target] = castlingMap[move.to];
    fromSquares.push(from);
    toSquares.push(to);
    targets.push(target);
  } else if (move.flags.includes("e")) {
    // En-passant
    const capturedPawnSquare = SQUARE_MAP[move.to[0] + move.from[1]];
    fromSquares.push(capturedPawnSquare);
  }
  const d = {
    "san": move.san,
    "from": fromSquares,
    "to": toSquares,
    "targets": targets
  }
  return d;
}

const combineData = (move1Data, move2Data) => {
  const badSquares = move2Data.from.concat(move2Data.to);
  let from1 = move1Data.from.filter(x => !badSquares.includes(x));

  let to1 = [];
  let targets1 = [];
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
  
  const data = {
    "sans": [move1Data.san, move2Data.san],
    "from": from,
    "to": to,
    "targets": targets
  }
  return data;
}

export const getMoveData = (board) => {
  let moveData = [];
  board.moves({ verbose: true }).forEach(move1 => {
    const move1Data = getData(move1);
    board.move(move1);
    let done = true;
    board.moves({ verbose: true }).forEach(move2 => {
      const move2Data = getData(move2);
      const movesData = combineData(move1Data, move2Data);
      const d = {
        "move1": move1Data,
        "move2": move2Data,
        "moves": movesData           
      }
      moveData.push(d);
      done = false;
    });
    if (done) {
      const d = {
        "move1": move1Data
      }
      moveData.push(d);
    }
    board.undo();
  });
  return moveData;
}