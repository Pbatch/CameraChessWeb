import { useNavigate } from "react-router";
import { useUser } from "../../slices/userSlice";
import buttonClass from "../common/buttonClass";

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
      className={`${buttonClass("outline-light", "lg")} w-full`}
      onClick={handleClick}
      disabled={noNavigate}
    > 
      <span className="block">{text}</span>
      {/* opacity rather than a fixed grey, so it follows the text colour on hover */}
      <small className="block text-base opacity-75">
        {noNavigate ? "Log in with Lichess to use" : description}
      </small>
    </button>
  )
}

export default NavButton;
