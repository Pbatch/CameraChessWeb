const Loader = ({ progress }: { progress: number }) => {
  const spinnerStyle = {"width": "5rem", "height": "5rem"}
  return ( 
    <div className="bg-dark text-white vh-100 d-flex flex-column justify-content-center align-items-center">
      <div className="row">
        <div className="spinner-border" style={spinnerStyle} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
      <div className="row">
        <h1>Loading: {(progress * 100).toFixed(2)}%</h1>
      </div>
    </div>
  );
};

export default Loader;