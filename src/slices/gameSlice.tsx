import { createSlice } from '@reduxjs/toolkit'
import { useSelector } from 'react-redux';
import type { Game, RootState } from '../types';
import { START_FEN } from '../utils/constants';
import { parseFen, makeFen } from 'chessops/fen';
import type { Move } from 'chessops';
import { Chess } from 'chessops/chess';
import { parsePgn } from 'chessops/pgn';
import { parseSan, makeSan } from 'chessops/san';
import { makeUci, parseUci } from 'chessops/util';

export type HistoryEntry = { move: Move; san: string };
export type CameraChessBoard = Chess & {
  startFen: string;
  history: HistoryEntry[];
  playSan: (san: string) => Move | null;
  playUci: (uci: string) => Move | null;
  undo: () => void;
};

const initialState: Game = {
  "moves": "",
  "fen": START_FEN,
  "start": START_FEN,
  "lastMove": "",
  "greedy": false,
  "fromOpponent": false,
  "error": null
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    gameSetMoves(state, action) {
      state.moves = action.payload
    },
    gameSetFen(state, action) {
      state.fen = action.payload;
    },
    gameSetStart(state, action) {
      state.start = action.payload;
    },
    gameSetLastMove(state, action) {
      state.lastMove = action.payload;
    },
    gameResetMoves(state) {
      state.moves = initialState.moves;
      state.lastMove = initialState.lastMove;
      state.greedy = initialState.greedy;
    },
    gameResetFen(state) {
      state.fen = initialState.fen;
    },
    gameResetStart(state) {
      state.start = initialState.start;
    },
    gameResetLastMove(state) {
      state.lastMove = initialState.lastMove;
    },
    gameSetError(state, action) {
      state.error = action.payload;
    },
    gameUpdate(state, action) {
      const newState: Game = {
        "start": state.start,
        "moves": action.payload.moves,
        "fen": action.payload.fen,
        "lastMove": action.payload.lastMove,
        "greedy": action.payload.greedy,
        "fromOpponent": action.payload.fromOpponent ?? false,
        "error": action.payload.error ?? null
      }
      return newState
    }
  }
})

type BoardWithMetadata = Chess & {
  startFen?: string;
  history?: HistoryEntry[];
};

const getMovesFromPgn = (pos: BoardWithMetadata, startFen: string) => {
  const setup = parseFen(startFen).unwrap();
  const tempPos = Chess.fromSetup(setup).unwrap();
  const history = pos.history as HistoryEntry[] || [];

  let pgn = "";
  history.forEach((entry: HistoryEntry) => {
    if (tempPos.turn === 'white') {
      pgn += `${tempPos.fullmoves}. `;
    }
    pgn += `${entry.san} `;
    tempPos.play(entry.move);
  });
  return pgn.trim();
}

export const useGame = () => {
  return useSelector((state: RootState) => state.game)
}

export const makePgn = (game: Game) => {
  return `[FEN "${game.start}"]\n \n${game.moves}`;
}

export const makeUpdatePayload = (board: BoardWithMetadata, greedy: boolean = false, fromOpponent: boolean = false, error: string | null = null) => {
  const history = board.history as HistoryEntry[] || [];
  const startFen = board.startFen || START_FEN;

  const moves = getMovesFromPgn(board, startFen);
  const fen = makeFen(board.toSetup());
  const lastMove = (history.length === 0) ? "" : makeUci(history[history.length - 1].move);

  const payload = {
    "moves": moves,
    "fen": fen,
    "lastMove": lastMove,
    "greedy": greedy,
    "fromOpponent": fromOpponent,
    "error": error
  }

  return payload
}

export const makeBoard = (game: Game): CameraChessBoard => {
  const setup = parseFen(game.start).unwrap();
  const board = Chess.fromSetup(setup).unwrap() as CameraChessBoard;
  board.startFen = game.start;
  board.history = [] as HistoryEntry[];

  const updateFromHistory = () => {
    const freshSetup = parseFen(board.startFen).unwrap();
    const freshBoard = Chess.fromSetup(freshSetup).unwrap();
    board.board = freshBoard.board;
    board.turn = freshBoard.turn;
    board.castles = freshBoard.castles;
    board.epSquare = freshBoard.epSquare;
    board.halfmoves = freshBoard.halfmoves;
    board.fullmoves = freshBoard.fullmoves;

    board.history.forEach((entry: HistoryEntry) => {
      board.play(entry.move);
    });
  };

  board.playSan = (san: string) => {
    const move = parseSan(board, san);
    if (move) {
      const entry: HistoryEntry = { move: move as Move, san };
      board.history.push(entry);
      board.play(move);
      return move;
    }
    return null;
  };

  board.playUci = (uci: string) => {
    const move = parseUci(uci);
    if (move) {
      const san = makeSan(board, move);
      const entry: HistoryEntry = { move, san };
      board.history.push(entry);
      board.play(move);
      return move;
    }
    return null;
  };

  board.undo = () => {
    if (board.history.length > 0) {
      board.history.pop();
      updateFromHistory();
    }
  };

  const games = parsePgn(game.moves);
  if (games.length > 0) {
    for (const node of games[0].moves.mainline()) {
      board.playSan(node.san);
    }
  }
  return board;
}

export const {
  gameSetMoves, gameResetMoves,
  gameSetFen, gameResetFen,
  gameSetStart, gameResetStart,
  gameSetLastMove, gameResetLastMove,
  gameUpdate, gameSetError
} = gameSlice.actions
export default gameSlice.reducer
