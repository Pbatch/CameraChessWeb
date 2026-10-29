import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PersistStorage, StorageValue } from "zustand/middleware";
import type { Game, RootState, User } from "./types";
import { START_FEN } from "./utils/constants";

const storageKey = "chesscam";
// Keys used before Zustand: Redux saved the state as is, and redux-persist each slice as its own JSON string
const reduxStorageKey = "state";
const reduxPersistStorageKey = "persist:root";

export const initialGame: Game = {
  moves: "",
  fen: START_FEN,
  start: START_FEN,
  lastMove: "",
  greedy: false,
  fromOpponent: false,
  clock: null
};

export const initialUser: User = {
  token: "",
  username: ""
};

// Errors belong to this session, so they are not shown again after a reload
type SavedState = Omit<RootState, "errors">;

// Fills fields missing from older saves and drops ones the store no longer has
const withDefaults = <T extends object>(initial: T, saved: Partial<T> | undefined): T => {
  const merged = { ...initial };
  for (const key of Object.keys(initial) as (keyof T)[]) {
    if (saved?.[key] !== undefined) {
      merged[key] = saved[key] as T[keyof T];
    }
  }
  return merged;
}

const loadReduxState = (): Partial<SavedState> | null => {
  const saved = localStorage.getItem(reduxStorageKey);
  if (saved !== null) {
    return JSON.parse(saved) as Partial<SavedState>;
  }
  const legacy = localStorage.getItem(reduxPersistStorageKey);
  if (legacy !== null) {
    const { game, user } = JSON.parse(legacy) as Record<keyof SavedState, string>;
    return { game: JSON.parse(game) as Game, user: JSON.parse(user) as User };
  }
  return null;
}

// Only once the state is saved under the new key, so a failed save keeps the user logged in
const removeReduxState = () => {
  try {
    if (localStorage.getItem(storageKey) !== null) {
      localStorage.removeItem(reduxStorageKey);
      localStorage.removeItem(reduxPersistStorageKey);
    }
  } catch (error) {
    console.warn("Unable to remove the old saved state.", error);
  }
}

// localStorage can be full, blocked or hold bad JSON, none of which should stop the app
const storage: PersistStorage<SavedState> = {
  getItem: (name) => {
    try {
      const saved = localStorage.getItem(name);
      if (saved !== null) {
        return JSON.parse(saved) as StorageValue<SavedState>;
      }
      // Version 0, so persist migrates it and saves it under the new key
      const redux = loadReduxState();
      return (redux === null) ? null : { state: redux as SavedState, version: 0 };
    } catch (error) {
      console.warn("Unable to load saved state.", error);
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, JSON.stringify(value));
    } catch (error) {
      console.warn("Unable to save state.", error);
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.warn("Unable to clear saved state.", error);
    }
  }
};

export const useStore = create<RootState>()(persist(
  (): RootState => ({ game: initialGame, user: initialUser, errors: [] }),
  {
    name: storageKey,
    version: 1,
    storage,
    // The clock and who made the last move only mean something while following a live game
    partialize: ({ game, user }): SavedState => ({
      game: { ...game, clock: initialGame.clock, fromOpponent: initialGame.fromOpponent },
      user
    }),
    // Redux's state needs no changes beyond the defaults that merge fills in
    migrate: (saved) => saved as SavedState,
    merge: (saved, current) => {
      const { game, user } = (saved ?? {}) as Partial<SavedState>;
      return { ...current, game: withDefaults(initialGame, game), user: withDefaults(initialUser, user) };
    },
    onRehydrateStorage: () => removeReduxState
  }
));

// A way out when saved state stops the app from rendering; also logs out of Lichess
export const clearSavedState = () => {
  for (const key of [storageKey, reduxStorageKey, reduxPersistStorageKey]) {
    storage.removeItem(key);
  }
}
