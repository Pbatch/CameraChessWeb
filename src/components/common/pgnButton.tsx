import { useTranslation } from "react-i18next";
import SidebarButton from "./sidebarButton";
import type { SetStringArray } from "../../types";
import { makePgn, useGame } from "../../slices/gameSlice";

const PgnButton = ({ setText, playing }: {setText: SetStringArray, playing: boolean}) => {
  const pgn: string = makePgn(useGame());
  const { t } = useTranslation();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    void navigator.clipboard.writeText(pgn)
      .then(() => {
        if (!playing) {
          setText([t("common.copiedPgn")]);
        }
      })
      .catch((error: unknown) => {
        console.error("Unable to copy PGN", error);
        if (!playing) {
          setText([t("common.copyPgnFailed")]);
        }
      });
  }

  return (
    <SidebarButton onClick={handleClick}>
      {t("common.copyPgn")}
    </SidebarButton>
  );
};

export default PgnButton;
