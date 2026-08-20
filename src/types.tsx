import type { GraphModel } from "@tensorflow/tfjs-converter";

interface Study {
  id: string,
  name: string
}

interface ModelRefs {
  piecesModelRef: React.RefObject<GraphModel | null>,
  xcornersModelRef: React.RefObject<GraphModel | null>
}

type VideoRef = React.RefObject<HTMLVideoElement | null>;
type CanvasRef = React.RefObject<HTMLCanvasElement | null>;
type SidebarRef = React.RefObject<HTMLDivElement | null>;

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

type CornersKey = "h1" | "a1" | "a8" | "h8"; 
interface CornersPayload {
  key: CornersKey,
  xy: number[]
}
type CornersDict = {[key in CornersKey]: number[]};
type CornersRef = React.RefObject<CornersDict>;

interface Game {
  fen: string,
  moves: string,
  start: string,
  lastMove: string,
  greedy: boolean,
  fromOpponent: boolean,
  error: string | null
}

interface User {
  token: string,
  username: string
}

interface RootState {
  game: Game
  corners: CornersDict,
  user: User
}

type Mode = "record" | "upload" | "broadcast" | "play";

type SetBoolean = React.Dispatch<React.SetStateAction<boolean>>
type SetString = React.Dispatch<React.SetStateAction<string>>
type SetStringArray = React.Dispatch<React.SetStateAction<string[]>>
type SetNumber = React.Dispatch<React.SetStateAction<number>>
type SetStudy = React.Dispatch<React.SetStateAction<Study | null>>

export type { 
  RootState, Study, ModelRefs, MovesData, MovesPair, 
  CornersDict, CornersKey, CornersPayload, Game,
  SetBoolean, SetString, SetStringArray, SetNumber, Mode,
  SetStudy, VideoRef, CanvasRef, SidebarRef, CornersRef
}
