import type { CompiledModel } from "@litertjs/core";

interface Study {
  id: string,
  name: string
}

interface ModelRefs {
  chessqueriesModelRef: React.RefObject<CompiledModel | null>
}

type VideoRef = React.RefObject<HTMLVideoElement | null>;
type SidebarRef = React.RefObject<HTMLDivElement | null>;

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
  "move1": MovesData,
  "move2": MovesData | null,
  "moves": MovesData | null
}

type Clock = {
  wtime: number;      // white's remaining time, in milliseconds
  btime: number;      // black's remaining time, in milliseconds
  turn: "w" | "b";    // whose turn it is right now
  updatedAt: number;  // Date.now() at the moment these values arrived
  running: boolean;   // false when the game is paused or finished
  clock: Clock | null;
};

interface Game {
  fen: string,
  moves: string,
  start: string,
  lastMove: string,
  greedy: boolean,
  fromOpponent: boolean,
  error: string | null,
  clock: Clock | null
}

interface User {
  token: string,
  username: string
}

interface RootState {
  game: Game,
  user: User
}

type Mode = "record" | "upload" | "broadcast" | "play";

type SetBoolean = React.Dispatch<React.SetStateAction<boolean>>
type SetStringArray = React.Dispatch<React.SetStateAction<string[]>>
type SetNumber = React.Dispatch<React.SetStateAction<number>>
type SetStudy = React.Dispatch<React.SetStateAction<Study | null>>
type SetRoi = React.Dispatch<React.SetStateAction<Roi | null>>
type SetOrientation = React.Dispatch<React.SetStateAction<CornerName[] | null>>

export type { 
  RootState, Study, ModelRefs, MovesData, MovesPair, 
  Game,
  SetBoolean, SetStringArray, SetNumber, Mode,
  SetStudy, VideoRef, SidebarRef, Roi, RoiRef, SetRoi, CornerName, SetOrientation
}
