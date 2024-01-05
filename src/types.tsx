interface RootState {
  pgn: { value: string },
  corners: { value: CornersDict },
  fen: {value : string }
}

interface Context {
  piecesModelRef: any,
  xcornersModelRef: any,
  authRef: any
}

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

export type { RootState, Context, MovesData, MovesPair, CornersDict, CornersKey, CornersPayload }