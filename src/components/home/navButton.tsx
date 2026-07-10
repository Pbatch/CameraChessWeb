import { useNavigate } from "react-router-dom";
import { useUser } from "../../slices/userSlice";

const NavButton = ({ text, tokenRequired }: { text: string, tokenRequired: boolean }) => {
  const navigate = useNavigate();
  const token = useUser().token;

  const noNavigate = (token === "") && tokenRequired;

  const handleClick = () => {
    if (noNavigate) {
      return;
    }
    void navigate(`/${text.toLowerCase()}`);
  }

  return (
    <button 
      className="btn btn-dark btn-lg btn-outline-light w-100" 
      onClick={handleClick}
    > 
      {noNavigate ? `${text} (must Login)` : `${text}`}
    </button>
  )
}

export default NavButton;
