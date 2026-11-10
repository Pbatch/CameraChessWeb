import { useTranslation } from "react-i18next";
import SidebarButton from "./sidebarButton";
import type { SetStringArray } from "../../types";
import { makePgn, useGame } from "../../slices/gameSlice";
import { useCopyPgn } from "../../utils/useCopyPgn";

const PgnButton = ({ setText, playing }: {setText: SetStringArray, playing: boolean}) => {
  const pgn: string = makePgn(useGame());
  const { t } = useTranslation();
  // While playing, the sidebar's text is the game's, so the copy is silent
  const copy = useCopyPgn(playing ? undefined : setText);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    copy(pgn);
  }

  return (
    <SidebarButton onClick={handleClick}>
      {t("common.copyPgn")}
    </SidebarButton>
  );
};

export default PgnButton;
