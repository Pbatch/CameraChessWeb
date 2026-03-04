import { parseFen, makeFen } from "chessops/fen";
import { Chess, Position } from "chessops/chess";
import { Move, Role, Color, isNormal } from "chessops/types";
import { makeSan } from "chessops/san";
import { kingCastlesTo } from "chessops/util";
import { SQUARE_MAP, LABEL_MAP, SQUARE_NAMES } from "./constants";
import { MovesData, MovesPair } from "../types";

function* legalMoves(pos: Position): Generator<Move> {
  const ctx = pos.ctx();
  for (const [from, dests] of pos.allDests(ctx)) {
    for (const to of dests) {
      const piece = pos.board.get(from);
      if (piece?.role === 'pawn' && (to < 8 || to >= 56)) {
        for (const promotion of ['queen', 'rook', 'bishop', 'knight'] as Role[]) {
          yield { from, to, promotion };
        }
      } else if (piece?.role === 'king' && pos.board.get(to)?.color === pos.turn) {
        const side = to % 8 < from % 8 ? 'a' : 'h';
        yield { from, to: kingCastlesTo(pos.turn, side) };
      } else {
        yield { from, to };
      }
    }
  }
}

const castlingMap: { [id: string]: number[] } = {
  "g1": [SQUARE_MAP["h1"], SQUARE_MAP["f1"], LABEL_MAP["R"]],
  "c1": [SQUARE_MAP["a1"], SQUARE_MAP["d1"], LABEL_MAP["R"]],
  "g8": [SQUARE_MAP["h8"], SQUARE_MAP["f8"], LABEL_MAP["r"]],
  "c8": [SQUARE_MAP["a8"], SQUARE_MAP["d8"], LABEL_MAP["r"]]
}

const roleToLabel = (role: Role, color: Color): string => {
  const label = role === 'knight' ? 'n' : role[0];
  return color === 'white' ? label.toUpperCase() : label.toLowerCase();
}

const getData = (pos: any, move: any) => {
  if (!isNormal(move)) return null;

  const fromSquares: number[] = [move.from];
  const toSquares: number[] = [move.to];

  const piece = pos.board.get(move.from);
  const targetRole = move.promotion || piece?.role || 'pawn';
  const targets = [LABEL_MAP[roleToLabel(targetRole, pos.turn)]];

  // Castling
  if (piece?.role === 'king' && Math.abs(move.to - move.from) === 2) {
    const squareName = SQUARE_NAMES[move.to];
    if (castlingMap[squareName]) {
      const [from, to, target] = castlingMap[squareName];
      fromSquares.push(from);
      toSquares.push(to);
      targets.push(target);
    }
  }
  // En Passant
  else if (piece?.role === 'pawn' && move.to !== move.from && !pos.board.get(move.to) && (move.from % 8 !== move.to % 8)) {
    const capturedPawnSquare = (move.to % 8) + (move.from / 8 | 0) * 8;
    fromSquares.push(capturedPawnSquare);
  }

  const moveData: MovesData = {
    "sans": [makeSan(pos, move)],
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

export const getMovesPairs = (board: any) => {
  const fen = makeFen(board.toSetup());
  const setup = parseFen(fen).unwrap();
  const pos = Chess.fromSetup(setup).unwrap();

  const movesPairs: MovesPair[] = [];

  for (const move1 of legalMoves(pos)) {
    const move1Data = getData(pos, move1);
    if (!move1Data) continue;

    const pos2 = pos.clone();
    pos2.play(move1);

    let done = true;
    for (const move2 of legalMoves(pos2)) {
      const move2Data = getData(pos2, move2);
      if (!move2Data) continue;

      const movesData = combineData(move1Data, move2Data);
      const movesPair: MovesPair = {
        "move1": move1Data,
        "move2": move2Data,
        "moves": movesData
      }
      movesPairs.push(movesPair);
      done = false;
    }

    if (done) {
      const movesPair: MovesPair = {
        "move1": move1Data,
        "move2": null,
        "moves": null
      }
      movesPairs.push(movesPair);
    }
  }

  return movesPairs;
}
