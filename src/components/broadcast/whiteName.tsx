import { SetString } from "../../types";

const WhiteName = ({ setWhiteName }: {setWhiteName: SetString }) => {
  const handleChange = (e: any) => {
    setWhiteName(e.target.value);
  }
  
  return (
    <div className="text-white d-flex justify-content-between">
      <label className="form-check-label" htmlFor="whiteName">
        White:&nbsp;
      </label>
      <input type="text" id="whiteName" onChange={handleChange} />
    </div>
  )
}

export default WhiteName;