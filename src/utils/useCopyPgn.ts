import { useTranslation } from "react-i18next";
import type { SetStringArray } from "../types";

// Copies a PGN to the clipboard, saying with `setText` whether it worked; without it, the copy is silent
export const useCopyPgn = (setText?: SetStringArray) => {
  const { t } = useTranslation();

  return (pgn: string) => {
    void navigator.clipboard.writeText(pgn)
      .then(() => setText?.([t("common.copiedPgn")]))
      .catch((error: unknown) => {
        console.error("Unable to copy PGN", error);
        setText?.([t("common.copyPgnFailed")]);
      });
  }
}
