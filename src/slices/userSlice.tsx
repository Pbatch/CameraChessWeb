import { createSlice } from '@reduxjs/toolkit'
import { useSelector } from 'react-redux';
import { RootState } from '../types';

const initialState = {
  "token": "",
  "username": ""
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    userSetToken(state, action) {
      state.token = action.payload
    },
    userSetUsername(state, action) {
      state.username = action.payload
    },
    userReset() {
      return initialState
    }
  }
})

export const userSelect = () => {
  return useSelector((state: RootState) => state.user)
}


export const { userSetToken, userSetUsername, userReset } = userSlice.actions
export default userSlice.reducer