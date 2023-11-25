const Display = ({ text }) => {
  return (
  <div className="text-white">
    <div>
      {text[0]}
    </div>
    <div>
      {text[1]}
    </div>
  </div>
  );
};

export default Display;