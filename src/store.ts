import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { gameReducer, userReducer } from "./slices";
import type { RootState } from "./types";

const storageKey = "state";
// Key used by redux-persist, which stored each slice as its own JSON string
const legacyStorageKey = "persist:root";

const reducer = combineReducers({
  game: gameReducer,
  user: userReducer
})

const saveState = (state: RootState) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.warn("Unable to save state.", error);
  }
}

const loadState = (): RootState | undefined => {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
      return JSON.parse(saved) as RootState;
    }

    const legacy = localStorage.getItem(legacyStorageKey);
    if (legacy !== null) {
      const { game, user } = JSON.parse(legacy) as Record<keyof RootState, string>;
      const state: RootState = { game: JSON.parse(game), user: JSON.parse(user) };
      saveState(state);
      localStorage.removeItem(legacyStorageKey);
      return state;
    }
  } catch (error) {
    console.warn("Unable to load saved state.", error);
  }
  return undefined;
}

const store = configureStore({
  reducer,
  preloadedState: loadState(),
});

let lastState = store.getState();
store.subscribe(() => {
  const state = store.getState();
  if (state !== lastState) {
    lastState = state;
    saveState(state);
  }
});

export default store;
