import Socials from "./socials";
import NavButton from "./navButton";

const Home = () => {
  return (
    <div className="flex h-full flex-col overflow-auto bg-dark text-center text-white">
      {/* my-auto centres the modes and pushes the socials to the bottom */}
      <div className="home-modes mx-auto my-auto grid w-full gap-4 p-4">
        <h1 className="mb-4 flex items-center justify-center gap-2 text-[min(1.475rem+2.7vw,3.5rem)]/[1.2] font-medium">
          <img src="favicon.ico" alt="" />
          <span>ChessCam</span>
        </h1>
        <NavButton text="Upload" description="Turn a chess video into a PGN" />
        <NavButton text="Record" description="Record a game live with a camera" />
        <NavButton text="Play" description="Play a Lichess game on a real board" />
        <NavButton text="Broadcast" description="Stream a game to Lichess live" />
      </div>
      <div className="my-2 flex">
        <Socials />
      </div>
    </div>
  );
};

export default Home;
