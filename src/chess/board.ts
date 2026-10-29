import { Chess, type Position } from "chessops/chess";
import { parseFen, makeFen } from "chessops/fen";
import type { Move } from "chessops/types";
import { parseSan, makeSan } from "chessops/san";
import { makeUci, parseUci } from "chessops/util";

export type HistoryEntry = { move: Move; san: string };

const positionFromFen = (fen: string): Chess => Chess.fromSetup(parseFen(fen).unwrap()).unwrap();

// A game from its start position, keeping the moves played so they can be numbered and undone
export class GameBoard {
  readonly start: string;
  readonly history: HistoryEntry[] = [];
  #position: Chess;

  constructor(start: string) {
    this.start = start;
    this.#position = positionFromFen(start);
  }

  get position(): Position {
    return this.#position;
  }

  get fen(): string {
    return makeFen(this.#position.toSetup());
  }

  // The last move in UCI, or "" before any move
  get lastMove(): string {
    return (this.history.length === 0) ? "" : makeUci(this.history[this.history.length - 1].move);
  }

  // Numbered SAN from the start position, e.g. "1... e5 2. Nf3"
  get moves(): string {
    const pos = positionFromFen(this.start);
    let text = "";
    this.history.forEach(({ move, san }, index) => {
      if (pos.turn === "white") {
        text += `${pos.fullmoves}. `;
      } else if (index === 0) {
        text += `${pos.fullmoves}... `;
      }
      text += `${san} `;
      pos.play(move);
    });
    return text.trim();
  }

  // Each play returns the move, or null if it is not legal here
  playSan(san: string): Move | null {
    const move = parseSan(this.#position, san);
    return (move === undefined) ? null : this.#play(move, san);
  }

  playUci(uci: string): Move | null {
    const move = parseUci(uci);
    if (move === undefined || !this.#position.isLegal(move)) {
      return null;
    }
    return this.#play(move, makeSan(this.#position, move));
  }

  undo() {
    if (this.history.pop() === undefined) {
      return;
    }
    this.#position = positionFromFen(this.start);
    for (const { move } of this.history) {
      this.#position.play(move);
    }
  }

  #play(move: Move, san: string): Move {
    this.history.push({ move, san });
    this.#position.play(move);
    return move;
  }
}
