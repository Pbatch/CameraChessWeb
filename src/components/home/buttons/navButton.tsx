import { useNavigate } from "react-router-dom";

const NavButton = ({ text }: { text: string }) => {
  const navigate = useNavigate();

  return (
    <button 
      className="btn btn-dark btn-lg btn-outline-light w-100 p-3" 
      onClick={() => navigate(`/${text.toLowerCase()}`)}
    > 
      {text}
    </button>
  )
}

export default NavButton;