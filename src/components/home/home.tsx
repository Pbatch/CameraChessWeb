import Header from "./header";
import Socials from "./socials";
import NavButton from "./navButton";

const Home = () => {
  return (
    <div className="container-flex d-flex h-100 flex-column p-0 m-0 text-center text-white bg-dark">
      <Header />
      <div className="row py-2 m-0">
        <div className="col">
          <NavButton text="Upload" tokenRequired={false} />
        </div>
        <div className="col">
          <NavButton text="Record" tokenRequired={false} />
        </div>
      </div>
      <div className="row py-2 m-0">
        <div className="col">
          <NavButton text="Broadcast" tokenRequired={true} />
        </div>
        <div className="col">
          <NavButton text="Export" tokenRequired={true} />
        </div>
      </div>
      <div className="row py-2 m-0 mt-auto">
        <Socials />
      </div>
    </div>
  );
};

export default Home;
