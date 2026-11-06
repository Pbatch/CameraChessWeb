import { HomeButton, PgnButton } from "./index.tsx";
import type { Game, SetStringArray } from "../../types.ts";
import { useGame } from "../../slices/gameSlice.ts";
import type { ReactNode } from "react";
import ChessboardPreview from "./chessboardPreview.tsx";
import Clock from "../play/clock.tsx";
import ExportButton from "./exportButton.tsx";
import SidebarSection from "./sidebarSection.tsx";
import ButtonGroup from "./buttonGroup.tsx";

type SidebarProps = {
  playing: boolean;
  text: string[];
  setText: SetStringArray;
  // Only for games that aren't already on Lichess
  exportable?: boolean;
  // Defaults to while detecting
  showBoard?: boolean;
  // Puts the mode's own sections (its setup) above the board rather than below it, for modes whose setup stays
  // while detecting, so the board doesn't move when detection starts
  setupFirst?: boolean;
  children: ReactNode;
};

const Sidebar = ({ playing, text, setText, exportable = false, showBoard = playing, setupFirst = false, children }:
  SidebarProps) => {
  const game: Game = useGame();

  const boardDisplay = () => {
    return (
      <>
        {/* Sized in CSS (.sidebar), as it depends on the screen's height and what else is showing */}
        <ChessboardPreview fen={game.fen} squareSize="var(--sidebar-square)" lastMove={game.lastMove} />
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
        <ButtonGroup label="Game actions" className="sidebar-actions">
          <PgnButton setText={setText} playing={playing} />
          {exportable && <ExportButton setText={setText} />}
        </ButtonGroup>
        {/* A line of its own, apart from the game actions, as it leaves the page */}
        <HomeButton labelled={true} />
      </>
    );
  }

  const board = (
    <div hidden={!showBoard}>
      {/* Inline-block so the clock matches the board's width */}
      <div className="inline-block">
        {boardDisplay()}
      </div>
    </div>
  );
  const status = (
    <SidebarSection title="Status">
      {textDisplay()}
    </SidebarSection>
  );

  return (
    <div className={`sidebar flex flex-col text-center${setupFirst ? " sidebar--setup-first" : ""}${playing
      ? " sidebar--playing" : ""}`}>
      {setupFirst ? (
        <>
          {children}
          {/* Centred in the room between the setup and the game buttons, which then sit at the bottom */}
          <div className="sidebar-middle my-auto">
            {board}
            {status}
          </div>
        </>
      ) : (
        <>
          {board}
          {children}
          {status}
        </>
      )}
      {/* Pinned to the bottom when there's room to spare (with setupFirst, by the centring above) */}
      <SidebarSection title="Game" className={setupFirst ? "" : "mt-auto"}>
        {buttons()}
      </SidebarSection>
    </div>
  );
};

export default Sidebar;
