import { useTranslation } from "react-i18next";
import type { CSSProperties } from "react";
import CBURNETT_PIECES from "../../vendor/cburnettPieces.ts";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

const PIECES = {
  K: { image: CBURNETT_PIECES.K, label: "board.pieces.whiteKing" },
  Q: { image: CBURNETT_PIECES.Q, label: "board.pieces.whiteQueen" },
  R: { image: CBURNETT_PIECES.R, label: "board.pieces.whiteRook" },
  B: { image: CBURNETT_PIECES.B, label: "board.pieces.whiteBishop" },
  N: { image: CBURNETT_PIECES.N, label: "board.pieces.whiteKnight" },
  P: { image: CBURNETT_PIECES.P, label: "board.pieces.whitePawn" },
  k: { image: CBURNETT_PIECES.k, label: "board.pieces.blackKing" },
  q: { image: CBURNETT_PIECES.q, label: "board.pieces.blackQueen" },
  r: { image: CBURNETT_PIECES.r, label: "board.pieces.blackRook" },
  b: { image: CBURNETT_PIECES.b, label: "board.pieces.blackBishop" },
  n: { image: CBURNETT_PIECES.n, label: "board.pieces.blackKnight" },
  p: { image: CBURNETT_PIECES.p, label: "board.pieces.blackPawn" },
} as const;

type PieceCode = keyof typeof PIECES;

type BoardSquare = {
  coordinate: string;
  piece?: PieceCode;
};

type ChessboardPreviewProps = {
  fen: string;
  // Any CSS length, so the board can scale with the viewport
  squareSize?: string;
  lastMove: string | null;
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

const ChessboardPreview = ({ fen, squareSize = "20px", lastMove = null }: ChessboardPreviewProps) => {
  const { t } = useTranslation();
  const board = parseFen(fen);
  const positionDescription = board
    .filter((square): square is BoardSquare & { piece: PieceCode } => square.piece !== undefined)
    .map(({ coordinate, piece }) => t("board.pieceOn", { piece: t(PIECES[piece].label), square: coordinate }))
    .join(", ");
  const style = {
    "--chess-square-size": squareSize,
  } as CSSProperties;

  const from = lastMove?.slice(0, 2);
  const to = lastMove?.slice(2, 4);

  return (
    <div
      className="chessboard-preview mx-auto"
      style={style}
      role="img"
      aria-label={t("board.label", { pieces: positionDescription || t("board.empty") })}
    >
      {board.map(({ coordinate, piece }, index) => {
        const isLastMove = (coordinate === from) || (coordinate === to);

        return (<span
          key={coordinate}
          className={`chessboard-preview__square ${(Math.floor(index / 8) + index) % 2 === 0
            ? "chessboard-preview__square--light"
            : "chessboard-preview__square--dark"
            }${isLastMove ? " chessboard-preview__square--last-move" : ""}`}
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
        </span>);
      })}
    </div>
  );
};

export default ChessboardPreview;
