import { useNavigate } from "react-router-dom";

const HomeButton = () => {
  let navigate = useNavigate();

  const handleClick = () => {    
    navigate("/"); 
  }
  
  return (
    <button className="btn btn-dark btn-outline-light w-100" onClick={handleClick} >
      <i className="h4 bi bi-house"></i>
    </button>
  );
};

export default HomeButton;