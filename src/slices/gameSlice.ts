import { useStore, initialGame } from '../store';
import type { Game } from '../types';
import { GameBoard, makeBoard, makePgn, makeUpdatePayload } from '@chesscam/recorder';

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

// Kept with the store's actions, so components import the game's helpers from one place
export { makeBoard, makePgn, makeUpdatePayload };
