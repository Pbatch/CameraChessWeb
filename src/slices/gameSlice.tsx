import { createSlice } from '@reduxjs/toolkit'
import { useSelector } from 'react-redux';
import { RootState } from '../types';

const startingPosition = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const initialState = {
  "pgn": `[FEN "${startingPosition}"]`,
  "fen": startingPosition,
  "start": startingPosition
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    gameSetPgnAndFen(state, action) {
      state.pgn = action.payload.pgn;
      state.fen = action.payload.fen;
    },
    gameSetStart(state, action) {
      state.start = action.payload;
    },
    gameResetPgnAndFen(state) {
      state.pgn = `[FEN "${state.start}"]`;
      state.fen = state.start;
    }
  }
})

export const gameSelect = () => {
  return useSelector((state: RootState) => state.game)
}


export const { gameSetPgnAndFen, gameSetStart, gameResetPgnAndFen } = gameSlice.actions
export default gameSlice.reducer