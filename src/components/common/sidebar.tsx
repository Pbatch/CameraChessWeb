import { HomeButton, PgnButton } from "./index.tsx";
import type { Game, SetStringArray, SidebarRef } from "../../types.tsx";
import { useGame } from "../../slices/gameSlice.tsx";
import type { ReactNode } from "react";
import ChessboardPreview from "./chessboardPreview.tsx";

type SidebarProps = {
  sidebarRef?: SidebarRef;
  playing: boolean;
  text: string[];
  setText: SetStringArray;
  children: ReactNode;
};

const Sidebar = ({ sidebarRef, playing, text, setText, children }: SidebarProps) => {
  const game: Game = useGame();

  const boardDisplay = () => {
    return (
      <ChessboardPreview fen={game.fen} squareSize={20} />
    );
  }

  const textDisplay = () => {
    return (
      <div className="text-white" role="status" aria-live="polite" aria-atomic="true">
        {text.map((t) => <div key={t}>{t}</div>)}
      </div>
    )
  }

  const buttons = () => {
    return (
      <div className="btn-group w-100" role="group" aria-label="Game actions">
        <PgnButton setText={setText} playing={playing} />
        <HomeButton />
      </div>
    );
  }

  return (
    <div ref={sidebarRef} className="d-flex flex-column text-center mx-1"
      style={{"minWidth": "200px"}}>
      <ul className="nav nav-pills flex-column">
        <li className="my-1" style={{display: playing ? "inline-block": "none"}}>
          {boardDisplay()}
        </li>
        {children}
        <li className="border-top"></li>
        <li className="my-1">
          {textDisplay()}
        </li>
        <li className="border-top"></li>
        <li className="my-1">
          {buttons()}
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
