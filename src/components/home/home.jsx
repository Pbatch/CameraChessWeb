import { useNavigate } from "react-router-dom";

const Home = () => {
  let navigate = useNavigate();

  const handleRecordClick = () => {
    navigate("/record"); 
  }

  const handleExportClick = () => {
    navigate("/export");
  }

  return (
    <div className="container-fluid h-100 p-0 m-0 text-center text-white bg-dark">
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
          <button className="btn btn-dark btn-lg btn-outline-light w-100 p-3"
          onClick={handleRecordClick}>
            Record
          </button>
        </div>
        <div className="col">
          <button className="btn btn-dark btn-lg btn-outline-light w-100 p-3" 
          onClick={handleExportClick}>
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
