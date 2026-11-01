import { useStore } from '../store';
import type { Clock } from '../types';

export const clockSet = (clock: Clock | null) => {
  useStore.setState({ clock });
}

export const useClock = () => {
  return useStore((state) => state.clock)
}
