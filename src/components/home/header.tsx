import { useNavigate } from "react-router";
import { useUser } from "../../slices/userSlice";
import { lichessLogin, lichessLogout } from "../../api/lichess";

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
    <header className="d-flex justify-content-end px-3 py-2">
      <button type="button" className="btn btn-dark btn-outline-light text-nowrap" onClick={handleClick}>
        {username === "" ? "Login" : "Log out"}
      </button>
    </header>
  );
}

export default Header;
