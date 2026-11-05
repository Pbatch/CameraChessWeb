import { useStore } from '../store';
import type { Analysis } from '../engine/stockfish';

export const engineAnalysis = (analysis: Analysis | null) => {
  useStore.setState({ analysis });
}

export const useEngineAnalysis = () => {
  return useStore((state) => state.analysis);
}
