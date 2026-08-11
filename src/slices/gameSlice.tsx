import { createSlice } from '@reduxjs/toolkit'
import { useSelector } from 'react-redux';
import { Game, RootState } from '../types';
import { START_FEN } from '../utils/constants';
import { parseFen, makeFen } from 'chessops/fen';
import { Move } from 'chessops';
import { Chess } from 'chessops/chess';
import { parsePgn } from 'chessops/pgn';
import { parseSan, makeSan } from 'chessops/san';
import { makeUci, parseUci } from 'chessops/util';

type HistoryEntry = { move: Move; san: string };

const initialState: Game = {
  "moves": "",
  "fen": START_FEN,
  "start": START_FEN,
  "lastMove": "",
  "greedy": false,
  "fromOpponent": false,
  "error": null,
  "syncRequired": false
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
      const error = action.payload;
      state.error = error === null || typeof error === "string"
        ? error
        : error instanceof Error ? error.message : String(error);
    },
    gameSetSyncRequired(state, action) {
      state.syncRequired = Boolean(action.payload);
    },
    gameUpdate(state, action) {
      const newState: Game = {
        "start": state.start,
        "moves": action.payload.moves,
        "fen": action.payload.fen,
        "lastMove": action.payload.lastMove,
        "greedy": action.payload.greedy,
        "fromOpponent": action.payload.fromOpponent ?? false,
        "error": action.payload.error ?? null,
        "syncRequired": action.payload.syncRequired ?? state.syncRequired ?? false
      }
      return newState
    }
  }
})

const getMovesFromPgn = (pos: any, startFen: string) => {
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
  return `[FEN "${game.start}"]` + "\n \n" + game.moves;
}

export const makeUpdatePayload = (board: any, greedy: boolean = false, fromOpponent: boolean = false, error: string | null = null) => {
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
    "error": error,
    "syncRequired": false
  }

  return payload
}

export const makeBoard = (game: Game): any => {
  const setup = parseFen(game.start).unwrap();
  const board: any = Chess.fromSetup(setup).unwrap();
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

    board.history.forEach((entry: HistoryEntry) => board.play(entry.move));
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

export const makeBoardFromUci = (startFen: string, moves: string): any => {
  const normalizedStart = startFen === "startpos" ? START_FEN : startFen;
  const seed: Game = {
    ...initialState,
    start: normalizedStart,
    fen: normalizedStart
  };
  const board = makeBoard(seed);
  for (const uci of moves.trim().split(/\s+/).filter(Boolean)) {
    if (board.playUci(uci) === null) {
      throw new Error(`Lichess sent an invalid move: ${uci}`);
    }
  }
  return board;
};

export const {
  gameSetMoves, gameResetMoves,
  gameSetFen, gameResetFen,
  gameSetStart, gameResetStart,
  gameSetLastMove, gameResetLastMove,
  gameUpdate, gameSetError, gameSetSyncRequired
} = gameSlice.actions
export default gameSlice.reducer
