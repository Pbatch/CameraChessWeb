interface Study {
  id: string,
  name: string
}

// Square probabilities, and where each square query looked (null for models without that output)
interface ChessqueriesOutputs {
  probs: Float32Array,
  centroids: Float32Array | null
}

// The piece model, on the GPU or in a CPU worker. A null video gives blank pixels, for the warm-up.
interface Chessqueries {
  run: (video: HTMLVideoElement | null, roi: Roi | null) => Promise<ChessqueriesOutputs>,
  delete: () => void
}

interface ModelRefs {
  chessqueriesModelRef: React.RefObject<Chessqueries | null>
}

type VideoRef = React.RefObject<HTMLVideoElement | null>;

// Region of interest, in video pixels
interface Roi {
  x: number,
  y: number,
  width: number,
  height: number
}
type RoiRef = React.RefObject<Roi | null>;

type CornerName = "a8" | "h8" | "h1" | "a1";

interface MovesData {
  sans: string[],
  from: number[],
  to: number[],
  targets: number[]
}
interface MovesPair {
  move1: MovesData,
  move2: MovesData | null,
  moves: MovesData | null
}

type Clock = {
  wtime: number;      // white's remaining time, in milliseconds
  btime: number;      // black's remaining time, in milliseconds
  turn: "w" | "b";    // whose turn it is right now
  updatedAt: number;  // Date.now() at the moment these values arrived
  running: boolean;   // false when the game is paused or finished
};

interface Game {
  fen: string,
  moves: string,
  start: string,
  lastMove: string,
  greedy: boolean,
  fromOpponent: boolean,
  clock: Clock | null
}

interface User {
  token: string,
  username: string
}

// Where a toast error came from, so only that source clears it
type ErrorSource = "login" | "broadcast" | "stream" | "move";

interface AppError {
  source: ErrorSource,
  message: string
}

interface RootState {
  game: Game,
  user: User,
  errors: AppError[]
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
  RootState, Study, Clock, User, Chessqueries, ChessqueriesOutputs, ModelRefs, MovesData, MovesPair, 
  Game, ErrorSource, AppError,
  SetBoolean, SetStringArray, SetNumber, SetFps, Mode,
  SetStudy, VideoRef, Roi, RoiRef, SetRoi, CornerName, SetOrientation, Camera
}
