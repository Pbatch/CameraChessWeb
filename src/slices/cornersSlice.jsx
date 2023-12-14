import { createSlice } from '@reduxjs/toolkit';

const initialState = {"value": {"h1": [50, -100], "a1": [0, -100], "a8": [0, -150], "h8": [50, -150]}};


const cornersSlice = createSlice({
  name: 'corners',
  initialState,
  reducers: {
    cornersSet(state, action) {
      state.value[action.payload.key] = action.payload.xy;
    },
    cornersReset(state) {
     state.value = initialState.value; 
    }
  }
})


export const { cornersSet, cornersReset } = cornersSlice.actions

// Export the slice reducer as the default export
export default cornersSlice.reducer