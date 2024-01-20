import { createSlice } from '@reduxjs/toolkit'
import { useSelector } from 'react-redux';
import { Game, RootState } from '../types';
import { START_FEN } from '../utils/constants';

const initialState: Game = {
  "moves": "",
  "fen": START_FEN,
  "start": START_FEN
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
    gameResetMoves(state) {
      state.moves = initialState.moves;
    },
    gameResetFen(state) {
      state.fen = initialState.fen;
    },
    gameResetStart(state) {
      state.start = initialState.start;
    }
  }
})

export const gameSelect = () => {
  return useSelector((state: RootState) => state.game)
}

export const makePgn = (game: Game) => {
  return `[FEN "${game.start}"]` + "\n \n" + game.moves;
}


export const { 
  gameSetMoves, gameSetFen, gameSetStart, 
  gameResetMoves, gameResetFen, gameResetStart 
} = gameSlice.actions
export default gameSlice.reducer