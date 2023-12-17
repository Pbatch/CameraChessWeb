const LoginButton = ({ authRef }) => {

  const handleClick = (e) => {
    authRef.current.login();
  }
  
  return (
    <button className="btn btn-dark btn-lg btn-outline-light w-100 p-3" onClick={handleClick}>
      Login
    </button>
  );
}

export default LoginButton;