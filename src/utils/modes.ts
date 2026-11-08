import { useMatches } from "react-router";
import type { Mode } from "../types";

// The name of each mode, as on its button on the home page
export const MODE_NAMES = {
  upload: "home.upload", record: "home.record", play: "home.play", broadcast: "home.broadcast"
} as const satisfies Record<Mode, string>;

// Each mode's route says which mode it is (index.tsx), so nothing has to work it out from the address
export type ModeHandle = { mode: Mode };

// The mode of the page showing, or null on a page without one (home)
export const useRouteMode = (): Mode | null => {
  const matches = useMatches();
  for (const { handle } of matches) {
    const mode = (handle as Partial<ModeHandle> | undefined)?.mode;
    if (mode !== undefined) return mode;
  }
  return null;
};
