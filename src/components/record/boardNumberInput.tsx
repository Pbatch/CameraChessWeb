import { setNumber } from "../../types";

const BoardNumberInput = ({ setBoardNumber }: {setBoardNumber: setNumber }) => {
  const handleChange = (e: any) => {
    setBoardNumber(e.target.value);
  }
  
  return (
    <div className="text-white">
      Board:&nbsp; 
      <input type="number" onChange={handleChange} min={1} max={64} />
    </div>
  )
}

export default BoardNumberInput;