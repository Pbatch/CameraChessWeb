import type { Piece, Role, SquareName } from "chessops/types";

export const START_FEN: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
export const CHESSQUERIES_SIZE: number = 448;
// Black pieces, white pieces, then the empty square
const LABELS: string[] = ["b", "k", "n", "p", "q", "r", "B", "K", "N", "P", "Q", "R", "."];
export const NUM_LABELS: number = LABELS.length;
export const EMPTY: number = LABELS.indexOf(".");
export const PIECE_SYMBOLS: Role[] = ["bishop", "king", "knight", "pawn", "queen", "rook"];

export const labelToPiece = (label: number): Piece => ({
  role: PIECE_SYMBOLS[label % 6],
  color: (label > 5) ? 'white' : 'black'
});

export const pieceToLabel = (piece: Piece): number =>
  ((piece.color === 'white') ? 6 : 0) + PIECE_SYMBOLS.indexOf(piece.role);
export const SQUARE_NAMES: SquareName[] = ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
  'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
  'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
  'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
  'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
  'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
  'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
  'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'];

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

export const MEDIA_ASPECT_RATIO: number = 16 / 9;
type ExtendedMediaTrackConstraints = MediaTrackConstraints & {
  resizeMode?: ConstrainDOMString;
};

export const MEDIA_CONSTRAINTS: { audio: false, video: ExtendedMediaTrackConstraints } = {
  "audio": false,
  "video": {
    "facingMode": {
      "ideal": "environment"
    },
    "width": {
      "ideal": 1280
    },
    // Without resizing, this only picks the closest native mode, so the stream can still be 4:3 or portrait
    "aspectRatio": MEDIA_ASPECT_RATIO,
    // Native frames only: no browser crop or upscale
    "resizeMode": "none"
  }
}
