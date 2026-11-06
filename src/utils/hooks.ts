import { useCallback, useEffect, useSyncExternalStore } from "react";

export const useMediaQuery = (query: string) => {
  const subscribe = useCallback((onChange: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}

// Keeps the screen on while `active`, e.g. while detecting moves, as a long game can outlast the screen's timeout
export const useWakeLock = (active: boolean) => {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      // Only a visible page can hold the lock
      if (document.visibilityState !== "visible" || sentinel !== null) return;
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          void lock.release();
          return;
        }
        sentinel = lock;
        // The browser releases it when the page is hidden, so it is taken again when the page shows
        lock.addEventListener("release", () => { sentinel = null; });
      } catch (error) {
        // Refused, e.g. in battery saver mode, when the screen may still sleep
        console.warn("Unable to keep the screen on", error);
      }
    };

    const onVisibility = () => void acquire();
    document.addEventListener("visibilitychange", onVisibility);
    void acquire();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void sentinel?.release();
    };
  }, [active]);
}
