import { createSlice } from '@reduxjs/toolkit'
import { useSelector } from 'react-redux';
import { Game, RootState } from '../types';
import { START_FEN } from '../utils/constants';
import { Chess } from 'chess.js';

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

const getMovesFromPgn = (board: Chess) => {
  const pgn = board.pgn();

  // Get rid of the headers (strings beginning with "[" and ending with "]")
  // Get rid of newline characters
  const moves = pgn.replace(/\[.*?\]/g, '').replace(/\r?\n|\r/g, '');
  return moves
}

export const gameSelect = () => {
  return useSelector((state: RootState) => state.game)
}

export const makePgn = (game: Game) => {
  return `[FEN "${game.start}"]` + "\n \n" + game.moves;
}

export const makeUpdatePayload = (board: Chess, greedy: boolean=false) => {
  const history = board.history({ "verbose": true });

  const moves = getMovesFromPgn(board);
  const fen = board.fen();
  const lastMove = (history.length === 0) ? "" : history[history.length - 1].lan;

  const payload = {
    "moves": moves,
    "fen": fen,
    "lastMove": lastMove,
    "greedy": greedy
  }

  return payload
}

export const makeBoard = (game: Game): Chess => {
  const board = new Chess(game.start);
  board.loadPgn(makePgn(game));
  return board;
}

export const { 
  gameSetMoves, gameResetMoves,
  gameSetFen, gameResetFen, 
  gameSetStart, gameResetStart,
  gameSetLastMove, gameResetLastMove, gameUpdate
} = gameSlice.actions
export default gameSlice.reducer