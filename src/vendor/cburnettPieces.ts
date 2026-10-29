// Cburnett chess pieces by Colin M.L. Burnett (https://en.wikipedia.org/wiki/User:Cburnett),
// licensed under GPLv2+. Taken from Lichess: https://github.com/lichess-org/lila/tree/master/public/piece/cburnett
// Vite inlines each as a data URL, as they are small.
import wK from "./cburnett/wK.svg";
import wQ from "./cburnett/wQ.svg";
import wR from "./cburnett/wR.svg";
import wB from "./cburnett/wB.svg";
import wN from "./cburnett/wN.svg";
import wP from "./cburnett/wP.svg";
import bK from "./cburnett/bK.svg";
import bQ from "./cburnett/bQ.svg";
import bR from "./cburnett/bR.svg";
import bB from "./cburnett/bB.svg";
import bN from "./cburnett/bN.svg";
import bP from "./cburnett/bP.svg";

const CBURNETT_PIECES = {
  K: wK,
  Q: wQ,
  R: wR,
  B: wB,
  N: wN,
  P: wP,
  k: bK,
  q: bQ,
  r: bR,
  b: bB,
  n: bN,
  p: bP,
} as const;

export default CBURNETT_PIECES;
