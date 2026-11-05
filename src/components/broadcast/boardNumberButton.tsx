import { Hash } from "lucide-react";
import { Dropdown, DropdownItem } from "../common";
import type { SetNumber } from "../../types";

// The boards a broadcast round can have
const BOARDS = Array.from({ length: 64 }, (_, i) => i + 1);

// Which board of the broadcast round this game is, picked like the other setup choices. -1 until one is picked.
const BoardNumberButton = ({ boardNumber, setBoardNumber, disabled = false }: {
  boardNumber: number,
  setBoardNumber: SetNumber,
  disabled?: boolean
}) => {
  const label = (boardNumber === -1) ? "Select a Board" : `Board: ${boardNumber}`;

  return (
    <Dropdown icon={Hash} label={label} disabled={disabled}>
      {BOARDS.map((board) =>
        <DropdownItem key={board} onClick={() => setBoardNumber(board)}>Board {board}</DropdownItem>
      )}
    </Dropdown>
  );
};

export default BoardNumberButton;
