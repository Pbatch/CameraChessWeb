import React, { ChangeEvent } from 'react';
import { SetNumber } from '../../types';

interface BoardNumberInputProps {
  setBoardNumber: SetNumber;
}

const BoardNumberInput: React.FC<BoardNumberInputProps> = ({ setBoardNumber }) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setBoardNumber(parseInt(e.target.value));
  };

  return (
    <div className="text-white">
      <label className="form-check-label" htmlFor="board">
        Board:&nbsp;
      </label>
      <input
        type="number"
        id="board"
        onChange={handleChange}
        min={1}
        max={64}
        className="form-control" // Add a suitable class for styling
      />
    </div>
  );
};

export default BoardNumberInput;
