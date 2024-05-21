import { SetNumber } from "../../types";

const BoardNumberInput = ({ setBoardNumber }: {setBoardNumber: SetNumber }) => {
  const handleChange = (e: any) => {
    setBoardNumber(parseInt(e.target.value));
  }
  
  return (
    <div className="text-white d-flex justify-content-between">
      <label className="form-check-label" htmlFor="board">
        Board:&nbsp;
      </label>
      <input type="number" id="board" onChange={handleChange} min={1} max={64} />
    </div>
  )
}

export default BoardNumberInput;