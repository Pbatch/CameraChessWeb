import { useCallback, useSyncExternalStore } from "react";

const subscribeResize = (onChange: () => void) => {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

export const useWindowWidth = () => useSyncExternalStore(subscribeResize, () => window.innerWidth);

export const useWindowHeight = () => useSyncExternalStore(subscribeResize, () => window.innerHeight);

export const useMediaQuery = (query: string) => {
  const subscribe = useCallback((onChange: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}
