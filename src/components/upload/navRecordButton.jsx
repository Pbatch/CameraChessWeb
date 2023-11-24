import { useNavigate } from "react-router-dom";

const NavRecordButton = () => {
  let navigate = useNavigate();

  const handleClick = () => {
    navigate("/"); 
  }
  
  return (
    <button className="btn btn-dark btn-sm btn-outline-light" onClick={handleClick} >
      To Record
    </button>
  );
};

export default NavRecordButton;