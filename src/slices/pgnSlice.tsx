import { createSlice } from '@reduxjs/toolkit'

const initialState = {"value": ""};

const pgnSlice = createSlice({
  name: 'pgn',
  initialState,
  reducers: {
    pgnSet(state, action) {
      state.value = action.payload
    },
  }
})


export const { pgnSet } = pgnSlice.actions

// Export the slice reducer as the default export
export default pgnSlice.reducer