import { useNavigate } from "react-router";
import { useUser } from "../../slices/userSlice";

const NavButton = ({ text, description, tokenRequired }:
  { text: string, description: string, tokenRequired: boolean }) => {
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
      type="button"
      className="btn btn-dark btn-lg btn-outline-light w-100" 
      onClick={handleClick}
      disabled={noNavigate}
    > 
      <span className="d-block">{text}</span>
      {/* opacity rather than a fixed grey, so it follows the text colour on hover */}
      <small className="d-block fs-6 opacity-75">
        {noNavigate ? "Log in with Lichess to use" : description}
      </small>
    </button>
  )
}

export default NavButton;
