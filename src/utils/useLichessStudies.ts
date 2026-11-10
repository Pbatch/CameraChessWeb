import { useEffect, useState } from "react";
import type { Study } from "../types";
import { describeLichessError, lichessSetStudies } from "../api/lichess";

// The user's Lichess studies, or only their broadcasts, and the error from loading them if that failed. Nothing loads
// while signed out (an empty token).
export const useLichessStudies = (token: string, username: string, onlyBroadcasts: boolean) => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (token === "") {
      return;
    }
    // A load for an earlier user or setting may finish after a later one, so only the latest is kept
    let current = true;
    const onStudies = (studies: Study[]) => {
      if (current) {
        setStudies(studies);
        setLoadError(null);
      }
    }
    void lichessSetStudies(token, onStudies, username, onlyBroadcasts)
      .catch((error: unknown) => {
        console.error("Unable to load Lichess studies", error);
        if (current) {
          setLoadError(describeLichessError(error));
        }
      });
    return () => {
      current = false;
    };
  }, [token, username, onlyBroadcasts]);

  return { studies, loadError };
}
