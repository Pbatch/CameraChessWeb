import { useNavigate } from "react-router-dom";

const HomeButton = () => {
  let navigate = useNavigate();

  const handleClick = () => {    
    navigate("/"); 
  }
  
  return (
    <button className="btn btn-dark btn-lg btn-outline-light w-100" onClick={handleClick} >
      <i className="bi bi-house"></i>
    </button>
  );
};

export default HomeButton;