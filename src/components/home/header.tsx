import { useNavigate } from "react-router";
import { useUser } from "../../slices/userSlice";
import { lichessLogin, lichessLogout } from "../../api/lichess";
import buttonClass from "../common/buttonClass";

const Header = () => {
  const navigate = useNavigate();
  const { username, token } = useUser();

  const handleClick = () => {
    if (username === "") {
      void lichessLogin();
    } else {
      void lichessLogout(token)
        .then(() => void navigate("/"));
    }
  }
  
  return (
    <header className="flex justify-end px-4 py-2">
      <button type="button" className={`${buttonClass()} text-nowrap`} onClick={handleClick}>
        {username === "" ? "Login" : "Log out"}
      </button>
    </header>
  );
}

export default Header;
