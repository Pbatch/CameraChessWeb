import { createSlice } from '@reduxjs/toolkit'
import { useSelector } from 'react-redux';
import { Game, RootState } from '../types';
import { START_FEN } from '../utils/constants';
import { parseFen, makeFen } from 'chessops/fen';
import { Chess } from 'chessops/chess';
import { parsePgn } from 'chessops/pgn';
import { parseSan } from 'chessops/san';
import { makeUci } from 'chessops/util';

const initialState: Game = {
  "moves": "",
  "fen": START_FEN,
  "start": START_FEN,
  "lastMove": "",
  "greedy": false
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    gameSetMoves(state, action) {
      state.moves = action.payload
    },
    gameSetFen(state, action) {
      state.fen = action.payload;
    },
    gameSetStart(state, action) {
      state.start = action.payload;
    },
    gameSetLastMove(state, action) {
      state.lastMove = action.payload;
    },
    gameResetMoves(state) {
      state.moves = initialState.moves;
    },
    gameResetFen(state) {
      state.fen = initialState.fen;
    },
    gameResetStart(state) {
      state.start = initialState.start;
    },
    gameResetLastMove(state) {
      state.lastMove = initialState.lastMove;
    },
    gameUpdate(state, action) {
      const newState: Game = {
        "start": state.start,
        "moves": action.payload.moves,
        "fen": action.payload.fen,
        "lastMove": action.payload.lastMove,
        "greedy": action.payload.greedy
      }
      return newState
    }
  }
})

const getMovesFromPgn = (pos: any, startFen: string) => {
  // Simple mainline PGN generator for chessops
  const setup = parseFen(startFen).unwrap();
  const tempPos = Chess.fromSetup(setup).unwrap();
  const history = pos.history || []; // We'll need to attach history to our chessops board objects

  let pgn = "";
  history.forEach((move: any) => {
    if (tempPos.turn === 'white') {
      pgn += `${tempPos.fullmoves}. `;
    }
    pgn += `${move.san} `;
    tempPos.play(move);
  });
  return pgn.trim();
}

export const gameSelect = () => {
  return useSelector((state: RootState) => state.game)
}

export const makePgn = (game: Game) => {
  return `[FEN "${game.start}"]` + "\n \n" + game.moves;
}

export const makeUpdatePayload = (board: any, greedy: boolean = false) => {
  const history = board.history || [];
  const startFen = board.startFen || START_FEN;

  const moves = getMovesFromPgn(board, startFen);
  const fen = makeFen(board.toSetup());
  const lastMove = (history.length === 0) ? "" : makeUci(history[history.length - 1]);

  const payload = {
    "moves": moves,
    "fen": fen,
    "lastMove": lastMove,
    "greedy": greedy
  }

  return payload
}

export const makeBoard = (game: Game): any => {
  const setup = parseFen(game.start).unwrap();
  const board: any = Chess.fromSetup(setup).unwrap();
  board.startFen = game.start;
  board.history = [];

  const updateFromHistory = () => {
    const freshSetup = parseFen(board.startFen).unwrap();
    const freshBoard = Chess.fromSetup(freshSetup).unwrap();
    board.board = freshBoard.board;
    board.turn = freshBoard.turn;
    board.castles = freshBoard.castles;
    board.epSquare = freshBoard.epSquare;
    board.halfmoves = freshBoard.halfmoves;
    board.fullmoves = freshBoard.fullmoves;

    board.history.forEach((m: any) => board.play(m));
  };

  board.playSan = (san: string) => {
    const move = parseSan(board, san);
    if (move) {
      (move as any).san = san;
      board.history.push(move);
      board.play(move);
      return move;
    }
    return null;
  };

  board.undo = () => {
    if (board.history.length > 0) {
      board.history.pop();
      updateFromHistory();
    }
  };

  const games = parsePgn(game.moves);
  if (games.length > 0) {
    for (const node of games[0].moves.mainline()) {
      board.playSan(node.san);
    }
  }
  return board;
}

export const {
  gameSetMoves, gameResetMoves,
  gameSetFen, gameResetFen,
  gameSetStart, gameResetStart,
  gameSetLastMove, gameResetLastMove, gameUpdate
} = gameSlice.actions
export default gameSlice.reducer