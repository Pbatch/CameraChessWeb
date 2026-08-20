import { useState } from "react";
import { lichessGetPlaying } from "../../utils/lichess";
import { useUser } from "../../slices/userSlice";
import { parseFen } from "chessops/fen";
import { Chess } from "chessops/chess";
import { gameSetStart, gameUpdate, makeUpdatePayload } from "../../slices/gameSlice";
import { useDispatch } from "react-redux";
import type { Dispatch, SetStateAction } from "react";
import type { Color } from "chessops/types";
import type { SetStringArray } from "../../types";
import type { NowPlayingGame } from "../../utils/lichess";

const GamesButton = ({ setGameId, setColor, setText }:
  {
    setGameId: Dispatch<SetStateAction<string | undefined>>,
    setColor: Dispatch<SetStateAction<Color | undefined>>,
    setText: SetStringArray
  }) => {
  const token: string = useUser().token;
  const [games, setGames] = useState<NowPlayingGame[]>([]);
  const [game, setGame] = useState<NowPlayingGame | null>(null);
  const dispatch = useDispatch();

  const handleClick = (newGame: NowPlayingGame) => {
    if (game?.fullId === newGame.fullId) {
      return;
    }

    setGame(newGame);
    setGameId(newGame.gameId);
    setColor((newGame.color === "white") ? "white" : "black");

    const colorText = (newGame.color === "white") ? "White" : "Black";
    const opponent = newGame.opponent.username;
    setText(["Starting game", `${colorText} vs ${opponent}`]);

    const setup = parseFen(newGame.fen).unwrap();
    const board = Chess.fromSetup(setup).unwrap();
    const payload = makeUpdatePayload(board);
    dispatch(gameUpdate(payload))
    dispatch(gameSetStart(newGame.fen));
  }

  const getGames = async () => {
    const playing = await lichessGetPlaying(token);
    setGames(playing.nowPlaying);
  }

  return (
    <div className="dropdown">
      <button type="button" className="btn btn-dark btn-sm btn-outline-light dropdown-toggle w-100" id="gamesButton" data-bs-toggle="dropdown" aria-expanded="false"
        onClick={() => { void getGames().catch((error: unknown) => {
          console.error("Unable to load Lichess games", error);
          setText(["Unable to load Lichess games"]);
        }); }}>
        {(game === null) ? "Select a Game" : `Game: ${game.opponent.username}`}
      </button>
      <ul className="dropdown-menu" aria-labelledby="gamesButton">
        {games.map((game) =>
          <li key={game.fullId}>
            <button type="button" onClick={() => handleClick(game)} className="dropdown-item">
              {game.opponent.username} ({game.gameId})
            </button>
          </li>
        )}
      </ul>
    </div>
  );
};

export default GamesButton;
