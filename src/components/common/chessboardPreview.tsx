import type { CSSProperties } from "react";
import CBURNETT_PIECES from "../../vendor/cburnettPieces.ts";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

const PIECES = {
  K: { image: CBURNETT_PIECES.K, label: "white king" },
  Q: { image: CBURNETT_PIECES.Q, label: "white queen" },
  R: { image: CBURNETT_PIECES.R, label: "white rook" },
  B: { image: CBURNETT_PIECES.B, label: "white bishop" },
  N: { image: CBURNETT_PIECES.N, label: "white knight" },
  P: { image: CBURNETT_PIECES.P, label: "white pawn" },
  k: { image: CBURNETT_PIECES.k, label: "black king" },
  q: { image: CBURNETT_PIECES.q, label: "black queen" },
  r: { image: CBURNETT_PIECES.r, label: "black rook" },
  b: { image: CBURNETT_PIECES.b, label: "black bishop" },
  n: { image: CBURNETT_PIECES.n, label: "black knight" },
  p: { image: CBURNETT_PIECES.p, label: "black pawn" },
} as const;

type PieceCode = keyof typeof PIECES;

type BoardSquare = {
  coordinate: string;
  piece?: PieceCode;
};

type ChessboardPreviewProps = {
  fen: string;
  squareSize?: number;
};

const emptyBoard = (): BoardSquare[] => Array.from({ length: 64 }, (_, index) => ({
  coordinate: `${FILES[index % 8]}${8 - Math.floor(index / 8)}`,
}));

const isPieceCode = (value: string): value is PieceCode => value in PIECES;

const parseFen = (fen: string): BoardSquare[] => {
  const ranks = fen.trim().split(/\s+/)[0]?.split("/");

  if (ranks?.length !== 8) {
    return emptyBoard();
  }

  const board: BoardSquare[] = [];

  for (const [rankIndex, rank] of ranks.entries()) {
    let fileIndex = 0;

    for (const value of rank) {
      if (/^[1-8]$/.test(value)) {
        const emptySquareCount = Number(value);
        for (let offset = 0; offset < emptySquareCount; offset += 1) {
          board.push({ coordinate: `${FILES[fileIndex]}${8 - rankIndex}` });
          fileIndex += 1;
        }
      } else if (isPieceCode(value) && fileIndex < 8) {
        board.push({
          coordinate: `${FILES[fileIndex]}${8 - rankIndex}`,
          piece: value,
        });
        fileIndex += 1;
      } else {
        return emptyBoard();
      }
    }

    if (fileIndex !== 8) {
      return emptyBoard();
    }
  }

  return board;
};

const ChessboardPreview = ({ fen, squareSize = 20 }: ChessboardPreviewProps) => {
  const board = parseFen(fen);
  const positionDescription = board
    .filter((square): square is BoardSquare & { piece: PieceCode } => square.piece !== undefined)
    .map(({ coordinate, piece }) => `${PIECES[piece].label} on ${coordinate}`)
    .join(", ");
  const style = {
    "--chess-square-size": `${squareSize}px`,
    width: squareSize * 8,
    height: squareSize * 8,
  } as CSSProperties;

  return (
    <div
      className="chessboard-preview mx-auto"
      style={style}
      role="img"
      aria-label={`Current chess position: ${positionDescription || "empty board"}`}
    >
      {board.map(({ coordinate, piece }, index) => (
        <span
          key={coordinate}
          className={`chessboard-preview__square ${
            (Math.floor(index / 8) + index) % 2 === 0
              ? "chessboard-preview__square--light"
              : "chessboard-preview__square--dark"
          }`}
          aria-hidden="true"
        >
          {piece && (
            <img
              className="chessboard-preview__piece"
              src={PIECES[piece].image}
              alt=""
              draggable={false}
            />
          )}
        </span>
      ))}
    </div>
  );
};

export default ChessboardPreview;
