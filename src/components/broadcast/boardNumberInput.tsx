import type { SetNumber } from "../../types";

const BoardNumberInput = ({ setBoardNumber }: {setBoardNumber: SetNumber }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBoardNumber(Number.parseInt(e.target.value, 10));
  }
  
  return (
    <div className="text-white">
      <label className="form-check-label" htmlFor="board">
        Board:&nbsp;
      </label>
      <input type="number" id="board" onChange={handleChange} min={1} max={64} />
    </div>
  )
}

export default BoardNumberInput;
