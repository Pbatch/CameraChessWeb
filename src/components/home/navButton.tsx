import { useNavigate } from "react-router-dom";
import { userSelect } from "../../slices/userSlice";

const NavButton = ({ text, tokenRequired }: { text: string, tokenRequired: boolean }) => {
  const navigate = useNavigate();
  const token = userSelect().token;

  const noNavigate = (token === "") && tokenRequired;

  const handleClick = () => {
    if (noNavigate) {
      return;
    }
    navigate(`/${text.toLowerCase()}`);
  }

  return (
    <button 
      className="btn btn-dark btn-lg btn-outline-light w-100 p-3" 
      onClick={handleClick}
    > 
      {noNavigate ? `${text} (must Login)` : `${text}`}
    </button>
  )
}

export default NavButton;