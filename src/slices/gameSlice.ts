import { useStore, initialGame } from '../store';
import type { Clock, Game } from '../types';
import { START_FEN } from '../utils/constants';
import { defaultGame, defaultHeaders, makeOutcome, makePgn as writePgn, parsePgn } from 'chessops/pgn';
import { GameBoard } from '../chess/board';

// Everything a move changes; the start position and clock are kept
export type GameUpdate = Omit<Game, 'start' | 'clock'>;

const setGame = (update: (game: Game) => Game) => {
  useStore.setState((state) => ({ game: update(state.game) }));
}

// Starts a new game from the given position, or the standard one
export const gameReset = (start: string = initialGame.start) => {
  setGame((game) => ({ ...initialGame, start, fen: start, clock: game.clock }));
}

// Takes back every move, keeping the start position
export const gameRestart = () => {
  setGame((game) => ({ ...initialGame, start: game.start, fen: game.start, clock: game.clock }));
}

export const gameUpdate = (update: GameUpdate) => {
  setGame((game) => ({ ...update, start: game.start, clock: game.clock }));
}

export const gameSetClock = (clock: Clock | null) => {
  setGame((game) => ({ ...game, clock }));
}

export const useGame = () => {
  return useStore((state) => state.game)
}

// Full PGN for export, with the seven standard tags plus any extra headers
export const makePgn = (game: Pick<Game, 'moves' | 'start'>, headers: Record<string, string> = {}) => {
  const pgnGame = parsePgn(game.moves)[0] ?? defaultGame();
  pgnGame.headers = defaultHeaders();
  pgnGame.headers.set('Result', makeOutcome(makeBoard(game).position.outcome()));
  if (game.start !== START_FEN) {
    pgnGame.headers.set('SetUp', '1');
    pgnGame.headers.set('FEN', game.start);
  }
  for (const [key, value] of Object.entries(headers)) {
    pgnGame.headers.set(key, value);
  }
  return writePgn(pgnGame);
}

export const makeUpdatePayload = (board: GameBoard, greedy: boolean = false, fromOpponent: boolean = false): GameUpdate => {
  return {
    moves: board.moves,
    fen: board.fen,
    lastMove: board.lastMove,
    greedy,
    fromOpponent
  }
}

export const makeBoard = (game: Pick<Game, 'moves' | 'start'>): GameBoard => {
  const board = new GameBoard(game.start);
  const games = parsePgn(game.moves);
  if (games.length > 0) {
    for (const node of games[0].moves.mainline()) {
      board.playSan(node.san);
    }
  }
  return board;
}
