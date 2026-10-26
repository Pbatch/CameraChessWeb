import { useNavigate } from "react-router-dom";
import { useUser } from "../../slices/userSlice";
import { lichessLogin, lichessLogout } from "../../api/lichess";
import { useDispatch } from "react-redux";

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { username, token } = useUser();

  const handleClick = () => {
    if (username === "") {
      void lichessLogin();
    } else {
      void lichessLogout(dispatch, token)
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
