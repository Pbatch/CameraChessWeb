import { NavButton, LoginButton, ExportButton, InfoButton } from "./buttons";
import Socials from "./socials";
import { useOutletContext } from "react-router-dom";


const Home = () => {
  const authRef = useOutletContext().authRef;

  const Title = () => {
    return (
      <div className="col-6 text-end">
        <h1>ChessCam</h1>
      </div>
    );
  }

  const Logo = () => {
    return (
      <div className="col">
        <img 
          src="home-128x128.svg" 
          style={{"width": 64}} 
          className="float-start img-fluid rounded-circle" 
          alt="ChessCam Logo" 
        />
      </div>
    )
  }

  return (
    <div className="container-flex d-flex h-100 flex-column p-0 m-0 text-center text-white bg-dark">
      <div className="row py-2 m-0 align-items-center">
        <Title />
        <Logo />
        <InfoButton />
      </div>
      <div className="row py-2 m-0">
        <div className="col">
          <NavButton text="Upload" />
        </div>
        <div className="col">
          <NavButton text="Record" />
        </div>
      </div>
      <div className="row py-2 m-0">
        <div className="col">
          <LoginButton authRef={authRef} />
        </div>
        <div className="col">
          <ExportButton authRef={authRef} />
        </div>
      </div>
      <div className="row py-2 m-0 mt-auto">
        <Socials />
      </div>
    </div>
  );
};

export default Home;
