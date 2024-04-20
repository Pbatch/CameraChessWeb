import { useState } from "react";
import { lichessGetPlaying } from "../../utils/lichess";
import { userSelect } from "../../slices/userSlice";
import { Chess } from "chess.js";
import { gameSetStart, gameUpdate, makeUpdatePayload } from "../../slices/gameSlice";
import { useDispatch } from "react-redux";
import { SetStringArray } from "../../types";

const GamesButton = ({setGameId, setColor, setText}: 
  { setGameId: any, setColor: any, setText: SetStringArray}) => {
  const token: string = userSelect().token;
  const [games, setGames] = useState<any[]>([]);
  const [game, setGame] = useState<any>(null);
  const dispatch = useDispatch();

  const handleClick = async (e: any, newGame: any) => {
    e.preventDefault();

    if (game?.fullId === newGame.fullId) {
      return;
    }

    setGame(newGame);
    setGameId(newGame.gameId);
    setColor((newGame.color === "white") ? "w" : "b");
    
    const colorText = (newGame.color === "white") ? "White" : "Black";
    const opponent = newGame.opponent.username;
    setText(["Starting game", `${colorText} vs ${opponent}`]);
    
    const board = new Chess(newGame.fen);
    const payload = makeUpdatePayload(board);
    dispatch(gameUpdate(payload))
    dispatch(gameSetStart(newGame.fen));
  }

  const getGames = async (e: any) => {
    e.preventDefault();

    const playing = await lichessGetPlaying(token);
    setGames(playing.nowPlaying);
  }

  return (
    <div className="dropdown">
      <button className="btn btn-dark btn-sm btn-outline-light dropdown-toggle w-100" id="deviceButton" data-bs-toggle="dropdown" aria-expanded="false"
      onClick={(e) => getGames(e)}>
      {(game === null) ? "Select a Game": `Game: ${game.opponent.username}`}
      </button>
      <ul className="dropdown-menu" aria-labelledby="deviceButton">
        {games.map((game: any) => 
          <li key={game.fullId}>
            <a onClick={(e) => handleClick(e, game)} className="dropdown-item" href="#">
              {game.opponent.username} ({game.gameId})
            </a>
          </li>
        )}
      </ul>
    </div>
  );
};

export default GamesButton;