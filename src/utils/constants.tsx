import { PieceSymbol, Square } from "chess.js";
import { CornersKey } from "../types";

export const START_FEN: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
export const MODEL_WIDTH: number = 480;
export const MODEL_HEIGHT: number = 288;
export const MARKER_RADIUS: number = 25;
export const MARKER_DIAMETER: number = 2 * MARKER_RADIUS;
export const LABELS: string[] = ["b", "k", "n", "p", "q", "r", "B", "K", "N", "P", "Q", "R"];
export const PIECE_SYMBOLS: PieceSymbol[] = ["b", "k", "n", "p", "q", "r"];
export const SQUARE_NAMES: Square[] = ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'];
export const SQUARE_SIZE: number = 128;
export const BOARD_SIZE: number = 8 * SQUARE_SIZE;
export const CORNER_KEYS: CornersKey[] = ["h1", "a1", "a8", "h8"];

const makeLabelMap = () => {
  const d: { [id: string]: number } = {};
  LABELS.forEach((label, i) => {
    d[label] = i;
  })
  return d;
}
export const LABEL_MAP: { [id: string]: number } = makeLabelMap();

const makeSquareMap = () => {
  const d: { [id: string]: number } = {};
  SQUARE_NAMES.forEach((square, i) => {
    d[square] = i;
  })
  return d;
}
export const SQUARE_MAP: { [id: string]: number } = makeSquareMap();

export const PALETTE: string[] = [
  "#FF3838",
  "#FF9D97",
  "#FF701F",
  "#FFB21D",
  "#CFD231",
  "#48F90A",
  "#92CC17",
  "#3DDB86",
  "#1A9334",
  "#00D4BB",
  "#2C99A8",
  "#00C2FF",
];

export const MEDIA_ASPECT_RATIO: number = 16 / 9;
export const MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  "audio": false,
  "video": {
    "facingMode": {
      "ideal": "environment"
    },
    "width": {
      "ideal": 1000
    },
    "aspectRatio": MEDIA_ASPECT_RATIO
  }
}