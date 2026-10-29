import { useStore } from '../store';
import type { AppError, ErrorSource } from '../types';

// Errors shown in the toast, newest last. Each source has at most one, so it can clear its own
// without touching another's.
export const errorShow = (error: AppError) => {
  useStore.setState(({ errors }) => ({
    errors: [...errors.filter(({ source }) => source !== error.source), error]
  }));
}

export const errorClear = (source: ErrorSource) => {
  // Unchanged when there is nothing to clear, as some sources clear on every event
  if (useStore.getState().errors.some((error) => error.source === source)) {
    useStore.setState(({ errors }) => ({ errors: errors.filter((error) => error.source !== source) }));
  }
}

// The error the toast shows, if any
export const useLatestError = () => {
  return useStore((state) => state.errors[state.errors.length - 1] ?? null)
}
