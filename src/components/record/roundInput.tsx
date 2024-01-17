import { setString } from "../../types";

const RoundInput = ({ setRound }: {setRound: setString }) => {
  const handleChange = (e: any) => {
    setRound(e.target.value);
  }
  
  return (
    <div className="text-white">
      Round:&nbsp; 
      <input type="text" onChange={handleChange} minLength={8} maxLength={8} />
    </div>
  )
}

export default RoundInput;