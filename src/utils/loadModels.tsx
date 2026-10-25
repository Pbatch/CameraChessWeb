import type { ModelRefs } from "../types";
import { loadChessqueries } from "./chessqueries";

let loadingModels: Promise<void> | null = null;

const LoadModels = (chessqueriesModelRef: ModelRefs["chessqueriesModelRef"]): Promise<void> => {
  if (chessqueriesModelRef.current !== null) {
    return Promise.resolve();
  }

  if (loadingModels !== null) {
    return loadingModels;
  }

  loadingModels = loadChessqueries().then((session) => {
    chessqueriesModelRef.current = session;
  }).catch((error) => {
    loadingModels = null;
    throw error;
  });

  return loadingModels;
};

export default LoadModels;
