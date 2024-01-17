interface Study {
  id: string,
  name: string
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

interface Game {
  fen: string,
  pgn: string
}

interface RootState {
  game: Game
  corners: CornersDict,
}

type setBoolean = React.Dispatch<React.SetStateAction<boolean>>
type setString = React.Dispatch<React.SetStateAction<string>>
type setStringArray = React.Dispatch<React.SetStateAction<string[]>>
type setNumber = React.Dispatch<React.SetStateAction<number>>

export type { 
  RootState, Study, Context, MovesData, MovesPair, 
  CornersDict, CornersKey, CornersPayload, Game,
  setBoolean, setString, setStringArray, setNumber
}