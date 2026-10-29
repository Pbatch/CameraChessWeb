import { useState } from "react";
import { describeLichessError, lichessGetPlaying } from "../../api/lichess";
import { useUser } from "../../slices/userSlice";
import { gameReset } from "../../slices/gameSlice";
import type { Dispatch, SetStateAction } from "react";
import type { Color } from "chessops/types";
import type { SetStringArray } from "../../types";
import type { NowPlayingGame } from "../../api/lichess";
import { Gamepad2 } from "lucide-react";
import { Dropdown, DropdownItem } from "../common";

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
    <Dropdown icon={Gamepad2} label={label} onClick={() => { void getGames().catch((error: unknown) => {
      console.error("Unable to load Lichess games", error);
      setText(["Unable to load Lichess games", describeLichessError(error)]);
    }); }}>
      {games.map((game) =>
        <DropdownItem key={game.fullId} onClick={() => handleClick(game)}>
          {game.opponent.username} ({game.gameId})
        </DropdownItem>
      )}
    </Dropdown>
  );
};

export default GamesButton;
