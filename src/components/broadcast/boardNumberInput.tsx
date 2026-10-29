import type { SetNumber } from "../../types";

const BoardNumberInput = ({ setBoardNumber }: {setBoardNumber: SetNumber }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBoardNumber(Number.parseInt(e.target.value, 10));
  }
  
  return (
    <div className="text-white">
      <label htmlFor="board">
        Board:&nbsp;
      </label>
      <input type="number" id="board" className="inline-block w-auto rounded border border-[#495057] bg-dark px-2 py-1 text-sm leading-normal text-[#dee2e6] focus:border-[#86b7fe] focus:ring-4 focus:ring-[#0d6efd]/25 focus:outline-none" onChange={handleChange} min={1} max={64} />
    </div>
  )
}

export default BoardNumberInput;
