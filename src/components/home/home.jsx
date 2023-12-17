import { NavButton, LoginButton, ExportButton } from "./buttons";
import Socials from "./socials";
import { useOutletContext } from "react-router-dom";



const Home = () => {
  const authRef = useOutletContext().authRef;

  return (
    <div className="container-flex d-flex h-100 flex-column p-0 m-0 text-center text-white bg-dark">
      <div className="row py-2 m-0">
        <div className="col">
          <h1>ChessCam</h1>
        </div>
      </div>
      <div className="row py-2 m-0">
        <div className="col">
          <img src="home-128x128.jpg" className="img-fluid rounded-circle" alt="ChessCam Logo" />
        </div>
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
      <footer className="mt-auto container">
        <div className="row py-2">
          <Socials />
        </div>
      </footer>
    </div>
  );
};

export default Home;
