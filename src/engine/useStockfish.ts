import i18n from "../i18n";
import { useEffect, useRef } from "react";
import { Stockfish } from "./stockfish";
import { engineAnalysis } from "../slices/engineSlice";
import { errorShow } from "../slices/errorSlice";

// Runs Stockfish on `fen` while enabled, putting its analysis in the store, which is cleared when it stops
export const useStockfish = (fen: string, enabled: boolean): void => {
  const engineRef = useRef<Stockfish | null>(null);
  // The latest position, for an engine started after it was set
  const fenRef = useRef<string>(fen);
  fenRef.current = fen;

  useEffect(() => {
    if (!enabled) return;

    const engine = new Stockfish(engineAnalysis, (error: unknown) => {
      console.error("Stockfish failed.", error);
      errorShow({ source: "engine", message: i18n.t("engine.failed") });
    });
    engineRef.current = engine;
    engine.analyse(fenRef.current);
    return () => {
      engine.terminate();
      engineRef.current = null;
      engineAnalysis(null);
    };
  }, [enabled]);

  useEffect(() => {
    engineRef.current?.analyse(fen);
  }, [fen]);
};
