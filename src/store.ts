import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PersistStorage, StorageValue } from "zustand/middleware";
import type { Game, RootState, User } from "./types";
import { START_FEN } from "./utils/constants";

const storageKey = "chesscam";

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

// Every board page starts a new game, so only the Lichess login outlives a reload
type SavedState = Pick<RootState, "user">;

// localStorage can be full, blocked or hold bad JSON, none of which should stop the app
const storage: PersistStorage<SavedState> = {
  getItem: (name) => {
    try {
      const saved = localStorage.getItem(name);
      return (saved === null) ? null : JSON.parse(saved) as StorageValue<SavedState>;
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
    storage,
    partialize: ({ user }): SavedState => ({ user }),
    merge: (saved, current) => {
      const user = (saved as Partial<SavedState> | undefined)?.user;
      return { ...current, user: { ...initialUser, ...user } };
    }
  }
));

// A way out when saved state stops the app from rendering; also logs out of Lichess
export const clearSavedState = () => {
  storage.removeItem(storageKey);
}

// Where Redux saved the state before Zustand. Only the Lichess login in it was worth keeping, so
// users log in again rather than it being carried over.
for (const key of ["state", "persist:root"]) {
  storage.removeItem(key);
}
