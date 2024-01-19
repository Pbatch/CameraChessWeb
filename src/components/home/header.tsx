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
    <div className="row py-2 m-0 align-items-center">
      <div className="col-5 text-end">
        <h3>
          ChessCam&nbsp;&nbsp;
          <i className="h1 bi bi-info-circle" onClick={() => navigate("/faq")}></i>
        </h3>
      </div>
      <div className="col-7 text-end">
        <h6>
          <button className="btn btn-dark btn-outline-light" onClick={handleClick}>
            {username === "" ? "Login" : "Logout"}
          </button>
          &nbsp;&nbsp;{username}
        </h6>   
      </div>

    </div>
  );
}

export default Header;