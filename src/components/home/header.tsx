import { useNavigate } from "react-router-dom";
import { useUser } from "../../slices/userSlice";
import { lichessLogin, lichessLogout } from "../../utils/lichess";
import { useDispatch } from "react-redux";

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { username, token } = useUser();

  const handleClick = () => {
    if (username === "") {
      lichessLogin();
    } else {
      void lichessLogout(dispatch, token)
        .then(() => void navigate("/"));
    }
  }
  
  return (
    <div className="row m-2">
      <div className="h1 col-6 h-100 d-flex justify-content-center align-items-end m-0">
        <img src="favicon.ico" alt="ChessCam logo" />
        <>&nbsp;</>
        <div>ChessCam</div>
      </div>
      <div className="col-6 h-100">
        <div className="h-100 d-flex justify-content-center align-items-end m-0">
          <button type="button" className="btn btn-dark btn-outline-light m-0" onClick={handleClick}>
            {username === "" ? "Login" : `Logout from "${username}"`}
          </button> 
        </div>
      </div>
    </div>
  );
}

export default Header;
