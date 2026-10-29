import { useStore, initialGame } from '../store';
import type { Clock, Game } from '../types';
import { START_FEN } from '../utils/constants';
import { defaultGame, defaultHeaders, makeComment, makeOutcome, makePgn as writePgn, parsePgn } from 'chessops/pgn';
import { GameBoard } from '../chess/board';

// Everything a move changes; the start position and clock are kept, and the times worked out
export type GameUpdate = Omit<Game, 'start' | 'clock' | 'times'>;

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

// Moves kept from before keep their times, so a greedy move confirmed later is timed from when it was
// first seen. New moves are timed at `elapsed`, and without it the game is untimed.
const updateTimes = (game: Game, moves: string, elapsed?: number): number[] => {
  if (elapsed === undefined) {
    return [];
  }
  const before = makeBoard(game).history;
  const after = makeBoard({ moves, start: game.start }).history;
  let kept = 0;
  while ((kept < Math.min(before.length, game.times.length)) && (before[kept].san === after[kept]?.san)) {
    kept += 1;
  }
  return [...game.times.slice(0, kept), ...after.slice(kept).map(() => elapsed)];
}

// `elapsed` is the ms since recording started, to time the new moves
export const gameUpdate = (update: GameUpdate, elapsed?: number) => {
  setGame((game) => ({
    ...update, start: game.start, clock: game.clock, times: updateTimes(game, update.moves, elapsed)
  }));
}

// Brings the game in line with Lichess's, from its start position and UCI moves. Lichess is the truth,
// except for moves it has not seen yet, which are ours still being sent.
export const gameSync = (start: string, uciMoves: string[]) => {
  const board = new GameBoard(start);
  for (const move of uciMoves) {
    if (board.playUci(move) === null) {
      throw new Error(`Lichess sent ${move}, which is illegal here`);
    }
  }

  const game: Game = useStore.getState().game;
  if (game.start === start) {
    const local = makeBoard(game).history;
    const ahead: boolean = (local.length >= board.history.length) &&
      board.history.every(({ san }, index) => local[index].san === san);
    if (ahead) {
      return;
    }
  }
  setGame((game) => ({ ...makeUpdatePayload(board, false, true), start, clock: game.clock, times: [] }));
}

export const gameSetClock =(clock: Clock | null) => {
  setGame((game) => ({ ...game, clock }));
}

export const useGame = () => {
  return useStore((state) => state.game)
}

// Full PGN for export, with the seven standard tags plus any extra headers, and with times, the
// time each move took as a [%emt] comment
export const makePgn = (game: Pick<Game, 'moves' | 'start'> & Partial<Pick<Game, 'times'>>,
  headers: Record<string, string> = {}) => {
  const pgnGame = parsePgn(game.moves)[0] ?? defaultGame();
  const times: number[] = game.times ?? [];
  let index = 0;
  for (const node of pgnGame.moves.mainline()) {
    if (index < times.length) {
      // Whole seconds, as detection is only good to about a second
      const emt = Math.round((times[index] - (times[index - 1] ?? 0)) / 1000);
      node.comments = [makeComment({ emt: Math.max(0, emt) })];
    }
    index += 1;
  }
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
