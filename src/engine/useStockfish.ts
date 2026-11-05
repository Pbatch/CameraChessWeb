import { useEffect, useRef } from "react";
import { Stockfish } from "./stockfish";
import { engineAnalysis } from "../slices/engineSlice";
import { errorShow } from "../slices/errorSlice";

// Runs Stockfish on `fen` while enabled, putting its analysis in the store, which is cleared when it stops
export const useStockfish = (fen: string, enabled: boolean): void => {
  const engineRef = useRef<Stockfish | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const engine = new Stockfish(engineAnalysis, (error: unknown) => {
      console.error("Stockfish failed.", error);
      errorShow({ source: "engine", message: "Unable to run Stockfish in this browser." });
    });
    engineRef.current = engine;
    return () => {
      engine.terminate();
      engineRef.current = null;
      engineAnalysis(null);
    };
  }, [enabled]);

  useEffect(() => {
    engineRef.current?.analyse(fen);
  }, [fen, enabled]);
};
