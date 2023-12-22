import { createSlice } from '@reduxjs/toolkit'

const initialState = {"value": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"};

const fenSlice = createSlice({
  name: 'fen',
  initialState,
  reducers: {
    fenSet(state, action) {
      state.value = action.payload
    },
  }
})


export const { fenSet } = fenSlice.actions

// Export the slice reducer as the default export
export default fenSlice.reducer