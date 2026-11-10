import { useStore, initialGame } from '../store';
import type { Game } from '../types';
import { START_FEN } from '../utils/constants';
import { defaultGame, defaultHeaders, makeComment, makeOutcome, makePgn as writePgn, parsePgn } from 'chessops/pgn';
import { GameBoard, makeBoard } from '../chess/board';

// Everything a move changes; the start position is kept, and the times worked out
type GameUpdate = Omit<Game, 'start' | 'times'>;

const setGame = (update: (game: Game) => Game) => {
  useStore.setState((state) => ({ game: update(state.game) }));
}

// Starts a new game from the given position, or the standard one
export const gameReset = (start: string = initialGame.start) => {
  setGame(() => ({ ...initialGame, start, fen: start }));
}

// Takes back every move, and has detection start a new tracker, so it reads the board afresh from the next frame
// even when there were no moves to take back
export const trackerReset = () => {
  useStore.setState((state) => ({
    game: { ...initialGame, start: state.game.start, fen: state.game.start },
    trackerResets: state.trackerResets + 1
  }));
}

// Moves kept from before keep their times, so a move shown before it was confirmed is timed from when it was first
// seen. New moves are timed at `elapsed`, less how long ago each was seen (`ago`, ms, by index in the game),
// as a move the tracker corrects may have been played a few seconds before it was shown, and without `elapsed` the
// game is untimed.
const updateTimes = (game: Game, moves: string, elapsed?: number, ago: (number | null)[] = []): number[] => {
  if (elapsed === undefined) {
    return [];
  }
  const before = makeBoard(game).history;
  const after = makeBoard({ moves, start: game.start }).history;
  let kept = 0;
  while ((kept < Math.min(before.length, game.times.length)) && (before[kept].san === after[kept]?.san)) {
    kept += 1;
  }
  const times = game.times.slice(0, kept);
  for (let i = kept; i < after.length; i++) {
    // Never before the move before it
    times.push(Math.max(elapsed - (ago[i] ?? 0), times[i - 1] ?? 0));
  }
  return times;
}

// `elapsed` is the ms since recording started, to time the new moves, and `ago` how long before now each move was
// seen, if known
export const gameUpdate = (update: GameUpdate, elapsed?: number, ago?: (number | null)[]) => {
  setGame((game) => ({
    ...update, start: game.start, times: updateTimes(game, update.moves, elapsed, ago)
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
  setGame(() => ({ ...makeUpdatePayload(board, true), start, times: [] }));
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

export const makeUpdatePayload = (board: GameBoard, fromOpponent: boolean = false): GameUpdate => {
  return {
    moves: board.moves,
    fen: board.fen,
    lastMove: board.lastMove,
    fromOpponent
  }
}

// Kept with GameBoard, so code outside the store can make boards without loading it
export { makeBoard };
