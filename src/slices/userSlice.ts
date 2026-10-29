import { useStore, initialUser } from '../store';
import type { User } from '../types';

export const userSet = (user: User) => {
  useStore.setState({ user });
}

export const userReset = () => {
  useStore.setState({ user: initialUser });
}

export const useUser = () => {
  return useStore((state) => state.user)
}
