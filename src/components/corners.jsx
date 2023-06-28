import Marker from "./marker.jsx";

const Corners = ({webcamRef, cornersRef}) => {
  return (
    <>
    <Marker name="a8" x={0} y={-75} cornersRef={cornersRef} />
    <Marker name="h8" x={50} y={-75} cornersRef={cornersRef} />
    <Marker name="h1" x={50} y={-25} cornersRef={cornersRef} />
    <Marker name="a1" x={0} y={-25} cornersRef={cornersRef} />
    </>
  );
};

export default Corners;