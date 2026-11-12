import type { CornerName, Game, Model, Roi } from "@chesscam/recorder";
import type { Analysis } from "./engine/stockfish";
interface Study {
  id: string,
  name: string
}

interface ModelRefs {
  modelRef: React.RefObject<Model | null>
}

type VideoRef = React.RefObject<HTMLVideoElement | null>;

type Clock = {
  wtime: number;      // white's remaining time, in milliseconds
  btime: number;      // black's remaining time, in milliseconds
  turn: "w" | "b";    // whose turn it is right now
  updatedAt: number;  // Date.now() at the moment these values arrived
  running: boolean;   // false when the game is paused or finished
};

interface User {
  token: string,
  username: string
}

// Stockfish's eval bar turned on or off in the account menu, for the mode it was turned on or off in
interface EngineChoice {
  mode: Mode,
  on: boolean
}

// Where a toast error came from, so only that source clears it
type ErrorSource = "login" | "broadcast" | "stream" | "move" | "engine";

interface AppError {
  source: ErrorSource,
  message: string
}

interface RootState {
  game: Game,
  // Apart from the game, as it updates far more often and only the clock shows it
  clock: Clock | null,
  user: User,
  // Until changed in the menu, the eval bar follows the mode's default (see engineSlice)
  engineChoice: EngineChoice | null,
  // A mode page is detecting, which the header's account menu doesn't let a sign-out interrupt
  detecting: boolean,
  errors: AppError[],
  // Stockfish's latest analysis, kept while the next position is analysed so the eval bar
  // doesn't jump back to even
  analysis: Analysis | null,
  // Counts the times the tracker was reset, so detection knows to start a new one
  trackerResets: number
}

type Mode = "record" | "upload" | "broadcast" | "play";

type SetBoolean = React.Dispatch<React.SetStateAction<boolean>>
type SetStringArray = React.Dispatch<React.SetStateAction<string[]>>
type SetNumber = React.Dispatch<React.SetStateAction<number>>
type SetFps = React.Dispatch<React.SetStateAction<number | null>>
type SetStudy = React.Dispatch<React.SetStateAction<Study | null>>
type SetRoi = React.Dispatch<React.SetStateAction<Roi | null>>
type SetOrientation = React.Dispatch<React.SetStateAction<CornerName[] | null>>

interface Camera {
  devices: MediaDeviceInfo[],
  deviceId: string | null,
  selectDevice: (deviceId: string) => void
}

export type { 
  RootState, Study, Clock, User, EngineChoice, ModelRefs, Game, ErrorSource, AppError,
  SetBoolean, SetStringArray, SetNumber, SetFps, Mode,
  SetStudy, VideoRef, Roi, SetRoi, CornerName, SetOrientation, Camera
}
