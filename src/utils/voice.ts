import { Move, Role, isNormal } from "chessops/types";
import { SQUARE_NAMES } from "./constants";
import { legalMoves } from "./moves";

export type VoiceMoveResolution = {
  move?: Move;
  message: string;
  normalized: string;
};

const roleNames: Array<[RegExp, Role]> = [
  [/\b(?:rey)\b/, "king"],
  [/\b(?:dama|reina)\b/, "queen"],
  [/\b(?:torre)\b/, "rook"],
  [/\b(?:alfil)\b/, "bishop"],
  [/\b(?:caballo)\b/, "knight"],
  [/\b(?:peon)\b/, "pawn"]
];

const spokenTokens: Record<string, string> = {
  "be": "b", "ce": "c", "de": "d", "efe": "f", "ge": "g", "hache": "h",
  "uno": "1", "un": "1", "dos": "2", "tres": "3", "cuatro": "4",
  "cinco": "5", "seis": "6", "siete": "7", "ocho": "8"
};

const englishSpokenTokens: Record<string, string> = {
  "bee": "b", "see": "c", "sea": "c", "dee": "d", "eff": "f", "gee": "g", "aitch": "h",
  "one": "1", "two": "2", "three": "3", "four": "4",
  "five": "5", "six": "6", "seven": "7", "eight": "8"
};

export const normalizeSpanishChessCommand = (transcript: string) => transcript
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9\s]/g, " ")
  .trim()
  .split(/\s+/)
  .map(token => spokenTokens[token] ?? token)
  .join(" ");

export const normalizeEnglishChessCommand = (transcript: string) => transcript
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, " ")
  .trim()
  .split(/\s+/)
  .map(token => englishSpokenTokens[token] ?? token)
  .join(" ");

const getRole = (command: string): Role | undefined =>
  roleNames.find(([pattern]) => pattern.test(command))?.[1];

const getPromotion = (command: string): Role | undefined => {
  if (/\b(?:dama|reina)\b/.test(command)) return "queen";
  if (/\btorre\b/.test(command)) return "rook";
  if (/\balfil\b/.test(command)) return "bishop";
  if (/\bcaballo\b/.test(command)) return "knight";
  return undefined;
};

const getSquares = (command: string): number[] => {
  const squares: number[] = [];
  const pattern = /(?:^|\s)([a-h])\s*([1-8])(?=\s|$)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(command)) !== null) {
    const square = SQUARE_NAMES.indexOf(`${match[1]}${match[2]}` as typeof SQUARE_NAMES[number]);
    if (square >= 0) squares.push(square);
  }
  return squares;
};

const originList = (moves: Move[], separator = " o ") => moves
  .filter(isNormal)
  .map(move => SQUARE_NAMES[move.from].toUpperCase())
  .filter((square, index, all) => all.indexOf(square) === index)
  .join(separator);

export const resolveSpanishVoiceMove = (board: any, transcript: string): VoiceMoveResolution => {
  const normalized = normalizeSpanishChessCommand(transcript);
  const moves = Array.from(legalMoves(board)).filter(isNormal);

  const castling = normalized.match(/\benroque\s+(corto|largo)\b/);
  if (castling) {
    const targetFile = castling[1] === "corto" ? 6 : 2;
    const candidates = moves.filter(move => {
      const piece = board.board.get(move.from);
      return piece?.role === "king" && move.to % 8 === targetFile;
    });
    return candidates.length === 1
      ? { move: candidates[0], message: `Enroque ${castling[1]}`, normalized }
      : { message: `El enroque ${castling[1]} no es legal en esta posición`, normalized };
  }

  const squares = getSquares(normalized);
  if (squares.length >= 2) {
    const [from, to] = squares;
    let candidates = moves.filter(move => move.from === from && move.to === to);
    if (candidates.length > 1) {
      const promotion = getPromotion(normalized) ?? "queen";
      candidates = candidates.filter(move => move.promotion === promotion);
    }
    if (candidates.length === 1) {
      return {
        move: candidates[0],
        message: `${SQUARE_NAMES[from].toUpperCase()} a ${SQUARE_NAMES[to].toUpperCase()}`,
        normalized
      };
    }
    return {
      message: `${SQUARE_NAMES[from].toUpperCase()} a ${SQUARE_NAMES[to].toUpperCase()} no es una jugada legal`,
      normalized
    };
  }

  const role = getRole(normalized);
  if (role && squares.length === 1) {
    const target = squares[0];
    const candidates = moves.filter(move => board.board.get(move.from)?.role === role && move.to === target);
    if (candidates.length === 1) {
      return { move: candidates[0], message: `${normalized} reconocido`, normalized };
    }
    if (candidates.length > 1) {
      return {
        message: `Jugada ambigua: indica el origen (${originList(candidates)}) y el destino`,
        normalized
      };
    }
    return { message: `No hay una jugada legal que corresponda a “${normalized}”`, normalized };
  }

  return {
    message: "No entendí el comando. Prueba “alfil C3” o “C4 a C5”",
    normalized
  };
};

const englishRoleNames: Array<[RegExp, Role]> = [
  [/\bking\b/, "king"],
  [/\bqueen\b/, "queen"],
  [/\brook\b/, "rook"],
  [/\bbishop\b/, "bishop"],
  [/\bknight\b/, "knight"],
  [/\bpawn\b/, "pawn"]
];

const getEnglishRole = (command: string): Role | undefined =>
  englishRoleNames.find(([pattern]) => pattern.test(command))?.[1];

const getEnglishPromotion = (command: string): Role | undefined => {
  if (/\bqueen\b/.test(command)) return "queen";
  if (/\brook\b/.test(command)) return "rook";
  if (/\bbishop\b/.test(command)) return "bishop";
  if (/\bknight\b/.test(command)) return "knight";
  return undefined;
};

export const resolveEnglishVoiceMove = (board: any, transcript: string): VoiceMoveResolution => {
  const normalized = normalizeEnglishChessCommand(transcript);
  const moves = Array.from(legalMoves(board)).filter(isNormal);

  const castling = normalized.match(/\b(?:castle|castling)\s+(king\s*side|queen\s*side)\b/);
  if (castling) {
    const side = castling[1].replace(/\s/g, "");
    const targetFile = side === "kingside" ? 6 : 2;
    const candidates = moves.filter(move => {
      const piece = board.board.get(move.from);
      return piece?.role === "king" && move.to % 8 === targetFile;
    });
    return candidates.length === 1
      ? { move: candidates[0], message: `${side === "kingside" ? "Kingside" : "Queenside"} castle`, normalized }
      : { message: `${side === "kingside" ? "Kingside" : "Queenside"} castling is not legal`, normalized };
  }

  const squares = getSquares(normalized);
  if (squares.length >= 2) {
    const [from, to] = squares;
    let candidates = moves.filter(move => move.from === from && move.to === to);
    if (candidates.length > 1) {
      const promotion = getEnglishPromotion(normalized) ?? "queen";
      candidates = candidates.filter(move => move.promotion === promotion);
    }
    if (candidates.length === 1) {
      return {
        move: candidates[0],
        message: `${SQUARE_NAMES[from].toUpperCase()} to ${SQUARE_NAMES[to].toUpperCase()}`,
        normalized
      };
    }
    return {
      message: `${SQUARE_NAMES[from].toUpperCase()} to ${SQUARE_NAMES[to].toUpperCase()} is not a legal move`,
      normalized
    };
  }

  const role = getEnglishRole(normalized);
  if (role && squares.length === 1) {
    const target = squares[0];
    const candidates = moves.filter(move => board.board.get(move.from)?.role === role && move.to === target);
    if (candidates.length === 1) {
      return { move: candidates[0], message: `${normalized} recognized`, normalized };
    }
    if (candidates.length > 1) {
      return {
        message: `Ambiguous move: say the origin (${originList(candidates, " or ")}) and destination`,
        normalized
      };
    }
    return { message: `There is no legal move matching “${normalized}”`, normalized };
  }

  return {
    message: "I did not understand. Try “bishop C3” or “C4 to C5”",
    normalized
  };
};

export const resolveVoiceMove = (board: any, transcript: string, language: "es-ES" | "en-US") =>
  language === "en-US"
    ? resolveEnglishVoiceMove(board, transcript)
    : resolveSpanishVoiceMove(board, transcript);
