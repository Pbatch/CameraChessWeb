import { HomeButton, PgnButton } from "./index.tsx";
import type { Game, SetStringArray } from "../../types.ts";
import { useGame } from "../../slices/gameSlice.ts";
import type { ReactNode } from "react";
import ChessboardPreview from "./chessboardPreview.tsx";
import Clock from "../play/clock.tsx";
import ExportButton from "./exportButton.tsx";
import { useUser } from "../../slices/userSlice.ts";
import SidebarSection from "./sidebarSection.tsx";

type SidebarProps = {
  playing: boolean;
  text: string[];
  setText: SetStringArray;
  // Only for games that aren't already on Lichess
  exportable?: boolean;
  children: ReactNode;
};

const Sidebar = ({ playing, text, setText, exportable = false, children }: SidebarProps) => {
  const game: Game = useGame();
  const token: string = useUser().token;

  const boardDisplay = () => {
    return (
      <>
        {/* Shrinks on short screens so the controls below it stay visible */}
        <ChessboardPreview fen={game.fen} squareSize="clamp(12px, (100dvh - 240px) / 8, 20px)"
          lastMove={game.lastMove} />
        <Clock />
      </>
    );
  }

  const textDisplay = () => {
    return (
      <div className="sidebar-status" role="status" aria-live="polite" aria-atomic="true" title={text.join("\n")}>
        {text.map((t) => <div key={t}>{t}</div>)}
      </div>
    )
  }

  const buttons = () => {
    return (
      <>
        <div className="sidebar-actions btn-group w-100" role="group" aria-label="Game actions">
          <PgnButton setText={setText} playing={playing} />
          {exportable && (token !== "") && <ExportButton setText={setText} />}
        </div>
        {/* A line of its own, apart from the game actions, as it leaves the page */}
        <HomeButton labelled={true} />
      </>
    );
  }

  return (
    <div className="sidebar d-flex flex-column text-center">
      <div hidden={!playing}>
        {/* Inline-block so the clock matches the board's width */}
        <div className="d-inline-block">
          {boardDisplay()}
        </div>
      </div>
      {children}
      <SidebarSection title="Status">
        {textDisplay()}
      </SidebarSection>
      {/* Pinned to the bottom when there's room to spare */}
      <SidebarSection title="Game" className="mt-auto">
        {buttons()}
      </SidebarSection>
    </div>
  );
};

export default Sidebar;
