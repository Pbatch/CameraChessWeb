import { useState } from "react";
import { describeLichessError, lichessGetPlaying } from "../../api/lichess";
import { useUser } from "../../slices/userSlice";
import { gameReset } from "../../slices/gameSlice";
import type { Dispatch, SetStateAction } from "react";
import type { Color } from "chessops/types";
import type { SetStringArray } from "../../types";
import type { NowPlayingGame } from "../../api/lichess";
import { Icon } from "../common";

const GamesButton = ({ setGameId, setColor, setText }:
  {
    setGameId: Dispatch<SetStateAction<string | undefined>>,
    setColor: Dispatch<SetStateAction<Color | undefined>>,
    setText: SetStringArray
  }) => {
  const token: string = useUser().token;
  const [games, setGames] = useState<NowPlayingGame[]>([]);
  const [game, setGame] = useState<NowPlayingGame | null>(null);

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

    gameReset(newGame.fen);
  }

  const getGames = async () => {
    const playing = await lichessGetPlaying(token);
    setGames(playing.nowPlaying);
  }

  const label = (game === null) ? "Select a Game" : `Game: ${game.opponent.username}`;

  return (
    <div className="dropdown">
      <button type="button" className="btn btn-dark btn-sm btn-outline-light dropdown-toggle w-100 d-flex align-items-center justify-content-center" id="gamesButton" data-bs-toggle="dropdown" aria-expanded="false"
        title={label} onClick={() => { void getGames().catch((error: unknown) => {
          console.error("Unable to load Lichess games", error);
          setText(["Unable to load Lichess games", describeLichessError(error)]);
        }); }}>
        <Icon iconName="bi-controller" className="me-2" />
        <span className="text-truncate">{label}</span>
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
