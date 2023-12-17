import { useNavigate } from "react-router-dom";

const ExportButton = ({ authRef }) => {
  const validAuth = authRef.current.me;

  let navigate = useNavigate();

  const handleClick = () => {
    if (!(validAuth)) {
      return;
    }

    navigate(`/export`);
  }

  return (
    <button 
      className="btn btn-dark btn-lg btn-outline-light w-100 p-3" 
      onClick={handleClick}
    > 
      {validAuth ? "Export" : "Export (requires Login)"}
    </button>
  )
}

export default ExportButton;