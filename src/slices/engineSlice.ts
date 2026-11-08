import { useStore } from '../store';
import type { Analysis } from '../engine/stockfish';
import type { EngineChoice, Mode } from '../types';

export const engineAnalysis = (analysis: Analysis | null) => {
  useStore.setState({ analysis });
}

export const useEngineAnalysis = () => {
  return useStore((state) => state.analysis);
}

// Whether Stockfish's eval bar shows. Each visit to a mode starts on for uploads and off for the camera modes, where
// the players at the board could see it, until it's switched in the menu. Never in play mode, where it would help in a
// live Lichess game.
export const isEngineOn = (mode: Mode, choice: EngineChoice | null): boolean => {
  if (mode === "play") return false;
  return (choice?.mode === mode) ? choice.on : (mode === "upload");
}

export const useEngineOn = (mode: Mode | null): boolean => {
  return useStore((state) => (mode !== null) && isEngineOn(mode, state.engineChoice));
}

export const engineToggle = (mode: Mode) => {
  useStore.setState(({ engineChoice }) => ({ engineChoice: { mode, on: !isEngineOn(mode, engineChoice) } }));
}

// Back to the mode's default, for the next visit: for the mode given, or any
export const engineChoiceClear = (mode?: Mode) => {
  useStore.setState(({ engineChoice }) => ({
    engineChoice: (mode === undefined || engineChoice?.mode === mode) ? null : engineChoice
  }));
}
