import engineUrl from "stockfish/bin/stockfish-19-lite-single.js?url";
import wasmUrl from "stockfish/bin/stockfish-19-lite-single.wasm?url";

// Deep enough to be far stronger than any player, and quick (~0.5s on a desktop core) so it rarely competes
// with detection for long
const DEPTH = 20;

// From White's side: centipawns, or moves to mate (negative when Black mates). mate 0 is checkmate on the board.
export type Score = { type: "cp" | "mate", value: number };

export type Analysis = {
  fen: string,
  depth: number,
  score: Score
};

type Info = { depth: number, score: Score };

// The depth and score of a UCI info line, with the score from the side to move. Bounds (from an aspiration
// window failing) and lines without a score, such as currmove updates, are skipped.
export const parseInfo = (line: string): Info | null => {
  const tokens = line.trim().split(/\s+/);
  if (tokens[0] !== "info" || tokens.includes("lowerbound") || tokens.includes("upperbound")) {
    return null;
  }

  const depthAt = tokens.indexOf("depth");
  const scoreAt = tokens.indexOf("score");
  if (depthAt === -1 || scoreAt === -1) {
    return null;
  }

  const type = tokens[scoreAt + 1];
  const value = Number(tokens[scoreAt + 2]);
  if ((type !== "cp" && type !== "mate") || !Number.isFinite(value)) {
    return null;
  }

  return { depth: Number(tokens[depthAt + 1]), score: { type, value } };
};

const whiteToMove = (fen: string): boolean => fen.split(" ")[1] !== "b";

// Engines score from the side to move. mate 0 stays 0, as the side to move is the one mated.
export const toWhite = (score: Score, fen: string): Score => {
  if (whiteToMove(fen)) return score;
  if (score.type === "mate" && score.value === 0) return score;
  return { type: score.type, value: -score.value };
};

// For the eval bar, without a sign as the side it sits on shows who is ahead: "0.3", "12", "M3", or "#"
export const formatShortScore = (score: Score): string => {
  if (score.type === "mate") {
    return (score.value === 0) ? "#" : `M${Math.abs(score.value)}`;
  }
  const pawns = Math.abs(score.value) / 100;
  return (pawns < 10) ? pawns.toFixed(1) : `${Math.round(pawns)}`;
};

// Lichess's winning chances (ui/lib/src/ceval/winningChances.ts), from -1 to 1 for White
const rawWinningChances = (cp: number): number => 2 / (1 + Math.exp(-0.00368208 * cp)) - 1;

export const winningChances = (score: Score, fen: string): number => {
  if (score.type === "cp") {
    return rawWinningChances(Math.min(Math.max(-1000, score.value), 1000));
  }
  // Mate on the board: the side to move has lost
  if (score.value === 0) {
    return whiteToMove(fen) ? -1 : 1;
  }
  const cp = (21 - Math.min(10, Math.abs(score.value))) * 100;
  return rawWinningChances(cp * Math.sign(score.value));
};

// Stockfish in a worker, analysing one position at a time. A new position stops the current search, and
// its lines are ignored until the engine confirms the stop with a bestmove.
export class Stockfish {
  #worker: Worker;
  #ready = false;
  #searching = false;
  #current: string | null = null;
  #pending: string | null = null;
  #onAnalysis: (analysis: Analysis) => void;

  constructor(onAnalysis: (analysis: Analysis) => void, onError: (error: unknown) => void) {
    this.#onAnalysis = onAnalysis;
    // The engine finds its wasm from the hash, as Vite gives the two files different hashed names
    this.#worker = new Worker(`${engineUrl}#${encodeURIComponent(new URL(wasmUrl, location.href).href)}`);
    this.#worker.onmessage = (e: MessageEvent) => {
      if (typeof e.data === "string") {
        this.#onLine(e.data);
      }
    };
    this.#worker.onerror = (e: ErrorEvent) => onError(e.error ?? e.message);
    this.#worker.postMessage("uci");
  }

  analyse(fen: string): void {
    if (fen === (this.#pending ?? this.#current)) return;

    this.#pending = fen;
    if (!this.#ready) return;

    if (this.#searching) {
      this.#worker.postMessage("stop");
    } else {
      this.#startPending();
    }
  }

  terminate(): void {
    this.#worker.terminate();
  }

  #startPending(): void {
    if (this.#pending === null) return;

    this.#current = this.#pending;
    this.#pending = null;
    this.#searching = true;
    this.#worker.postMessage(`position fen ${this.#current}`);
    this.#worker.postMessage(`go depth ${DEPTH}`);
  }

  #onLine(line: string): void {
    if (line === "uciok") {
      this.#ready = true;
      this.#startPending();
    } else if (line.startsWith("bestmove")) {
      this.#searching = false;
      this.#startPending();
    } else if (this.#searching && this.#pending === null && this.#current !== null) {
      const info = parseInfo(line);
      if (info !== null) {
        const fen = this.#current;
        this.#onAnalysis({
          fen,
          depth: info.depth,
          score: toWhite(info.score, fen)
        });
      }
    }
  }
}
