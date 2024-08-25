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
    <div className="row p-3 m-0">
      <div className="h3 col-3 px-1 h-100 d-flex justify-content-center align-items-end m-0">
        ChessCam
      </div>
      <div className="col-2 px-1 h-100">
        <i className="h1 bi bi-info-circle h-100 d-flex justify-content-center align-items-end m-0" onClick={() => navigate("/faq")}></i>
      </div>
      <div className="col-2 px-1 h-100">
        <div className="h-100 d-flex justify-content-center align-items-end m-0">
          <button className="btn btn-dark btn-outline-light m-0" onClick={handleClick}>
            {username === "" ? "Login" : "Logout"}
          </button> 
        </div>
      </div>
      <div className="h6 col-5 px-1 h-100 d-flex justify-content-center align-items-end m-0">
        {username}
      </div>
    </div>
  );
}

export default Header;