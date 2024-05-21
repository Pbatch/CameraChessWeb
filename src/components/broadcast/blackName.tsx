import { SetString } from "../../types";

const BlackName = ({ setBlackName }: {setBlackName: SetString }) => {
  const handleChange = (e: any) => {
    setBlackName(e.target.value);
  }
  
  return (
    <div className="text-white">
      <label className="form-check-label" htmlFor="blackName">
        Black:&nbsp;
      </label>
      <input type="text" id="blackName" onChange={handleChange} />
    </div>
  )
}

export default BlackName;