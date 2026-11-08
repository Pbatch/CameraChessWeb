import { useStore } from '../store';

// Whether a mode page is detecting (recording, broadcasting or playing), for controls outside it, such as the header
export const detectingSet = (detecting: boolean) => {
  useStore.setState({ detecting });
}

export const useDetecting = () => {
  return useStore((state) => state.detecting);
}
