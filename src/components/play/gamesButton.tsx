import { useTranslation } from "react-i18next";
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

const GamesButton = ({ setGameId, setColor, setText, disabled = false }:
  {
    setGameId: Dispatch<SetStateAction<string | undefined>>,
    setColor: Dispatch<SetStateAction<Color | undefined>>,
    setText: SetStringArray,
    disabled?: boolean
  }) => {
  const { t } = useTranslation();
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

    const opponent = newGame.opponent.username;
    setText([t("play.starting"), t((newGame.color === "white") ? "play.whiteVs" : "play.blackVs", { opponent })]);

    // Lichess's list only has the current board, so the game's start and moves come from its stream
    gameReset();
  }

  const getGames = async () => {
    const playing = await lichessGetPlaying(token);
    setGames(playing.nowPlaying);
  }

  const label = (game === null) ? t("play.selectGame") : t("play.selectedGame", { opponent: game.opponent.username });

  return (
    <Dropdown icon={Gamepad2} label={label} disabled={disabled} onClick={() => { void getGames().catch((error: unknown) => {
      console.error("Unable to load Lichess games", error);
      setText([t("play.loadGamesFailed"), describeLichessError(error)]);
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
