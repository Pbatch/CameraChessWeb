import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import {
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import storage from "redux-persist/lib/storage";
import pgnReducer from "./slices/pgnSlice";
import cornersReducer from "./slices/cornersSlice";
import fenReducer from "./slices/fenSlice";

const reducer = combineReducers({
  pgn: pgnReducer,
  corners: cornersReducer,
  fen: fenReducer
})

const persistConfig = {
  key: "root",
  version: 1,
  storage,
  blacklist: []
};

const persistedReducer = persistReducer(persistConfig, reducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
    },
  }),
});

export default store;