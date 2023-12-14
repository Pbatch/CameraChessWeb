export const MODEL_WIDTH = 640;
export const MODEL_HEIGHT = 384;
export const MARKER_RADIUS = 25;
export const MARKER_DIAMETER = 2 * MARKER_RADIUS;
export const LABELS = ["b", "k", "n", "p", "q", "r", "B", "K", "N", "P", "Q", "R"];
export const SQUARE_NAMES = ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'];
export const SQUARE_SIZE = 128;
export const BOARD_SIZE = 8 * SQUARE_SIZE;

const makeLabelMap = () => {
  let d = {};
  LABELS.forEach((label, i) => {
    d[label] = i;
  })
  return d;
}
export const LABEL_MAP = makeLabelMap();

const makeSquareMap = () => {
  let d = {};
  SQUARE_NAMES.forEach((square, i) => {
    d[square] = i;
  })
  return d;
}
export const SQUARE_MAP = makeSquareMap();