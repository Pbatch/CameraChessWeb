import { useNavigate } from "react-router-dom";
import { userSelect } from "../../slices/userSlice";
import { lichessLogin, lichessLogout } from "../../utils/lichess";
import { useDispatch } from "react-redux";

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const username: string = userSelect().username;

  const handleClick = () => {
    if (username === "") {
      lichessLogin();
    } else {
      lichessLogout(dispatch);
      navigate("/")
    }
  }
  
  return (
    <div className="row m-2">
      <div className="h1 col-6 h-100 d-flex justify-content-center align-items-end m-0">
        <img src="favicon.ico"></img>
        <>&nbsp;</>
        <div>ChessCam</div>
      </div>
      <div className="col-6 h-100">
        <div className="h-100 d-flex justify-content-center align-items-end m-0">
          <button className="btn btn-dark btn-outline-light m-0" onClick={handleClick}>
            {username === "" ? "Login" : `Logout from "${username}"`}
          </button> 
        </div>
      </div>
    </div>
  );
}

export default Header;