import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const NavUploadButton = () => {
  const pgn = useSelector(state => state.pgn.value);
  const style = {"display": (pgn === "") ? "none" : "inline-block"}
  
  let navigate = useNavigate();

  const handleClick = () => {
    navigate("/upload"); 
  }
  
  return (
    <button className="btn btn-dark btn-sm btn-outline-light" onClick={handleClick} 
    style={style}>
      To Upload
    </button>
  );
};

export default NavUploadButton;