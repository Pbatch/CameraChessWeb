import { createSlice } from '@reduxjs/toolkit';
import { CornersDict, CornersPayload } from "../types";

const initialDict: CornersDict = {"h1": [50, -100], "a1": [0, -100], "a8": [0, -150], "h8": [50, -150]}
const initialState = {"value": initialDict};

interface Action {
  payload: CornersPayload,
  type: string
}

const cornersSlice = createSlice({
  name: 'corners',
  initialState,
  reducers: {
    cornersSet(state, action: Action) {
      state.value[action.payload.key] = action.payload.xy;
    },
    cornersReset(state) {
     state.value = initialState.value; 
    }
  }
})

export const { cornersSet, cornersReset } = cornersSlice.actions
export default cornersSlice.reducer