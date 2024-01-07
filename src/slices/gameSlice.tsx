import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  "pgn": "",
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    gameSet(_, action) {
      return action.payload
    }
  }
})


export const { gameSet } = gameSlice.actions
export default gameSlice.reducer