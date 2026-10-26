import Header from "./header";
import Socials from "./socials";
import NavButton from "./navButton";

const Home = () => {
  return (
    <div className="d-flex overflow-auto h-100 flex-column p-0 m-0 text-center text-white bg-dark">
      <Header />
      {/* my-auto centres the modes and pushes the socials to the bottom */}
      <div className="home-modes d-grid gap-3 w-100 p-3 mx-auto my-auto">
        <h1 className="display-4 fw-medium d-flex align-items-center justify-content-center gap-2 mb-3">
          <img src="favicon.ico" alt="" />
          <span>ChessCam</span>
        </h1>
        <NavButton text="Upload" description="Turn a chess video into a PGN"
          tokenRequired={false} />
        <NavButton text="Record" description="Record a game live with a camera"
          tokenRequired={false} />
        <NavButton text="Play" description="Play a Lichess game on a real board"
          tokenRequired={true} />
        <NavButton text="Broadcast" description="Stream a game to Lichess live"
          tokenRequired={true} />
      </div>
      <div className="row my-2 mx-0">
        <Socials />
      </div>
    </div>
  );
};

export default Home;
