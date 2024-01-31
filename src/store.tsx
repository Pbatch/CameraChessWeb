import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import { persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from "redux-persist/lib/storage";
import logger from 'redux-logger'; // Import logger middleware for development

import { cornersReducer, gameReducer, userReducer } from "./slices";

const rootReducer = combineReducers({
  game: gameReducer,
  corners: cornersReducer,
  user: userReducer
})

const persistConfig = {
  key: "root",
  version: 1,
  storage,
  blacklist: []
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: [
    ...getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
    logger // Add logger middleware for development purposes
  ],
  devTools: process.env.NODE_ENV !== 'production' // Enable Redux DevTools extension in non-production environments
});

export default store;
