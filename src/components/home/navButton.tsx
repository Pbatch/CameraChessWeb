import { useNavigate } from "react-router";
import buttonClass from "../common/buttonClass";

// The Lichess modes ask for a login on their own pages
const NavButton = ({ text, description }: { text: string, description: string }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={`${buttonClass("outline-light", "lg")} w-full`}
      onClick={() => { void navigate(`/${text.toLowerCase()}`); }}
    >
      <span className="block">{text}</span>
      {/* opacity rather than a fixed grey, so it follows the text colour on hover */}
      <small className="block text-base opacity-75">{description}</small>
    </button>
  )
}

export default NavButton;
