import Marker from "./marker.jsx";

const Corners = ({ webcamRef, cornersRef, videoSize }) => {
  return (
    <>
    <Marker name="a8" x={0} y={-100} cornersRef={cornersRef} videoSize={videoSize} />
    <Marker name="h8" x={50} y={-100} cornersRef={cornersRef} videoSize={videoSize} />
    <Marker name="h1" x={50} y={-50} cornersRef={cornersRef} videoSize={videoSize} />
    <Marker name="a1" x={0} y={-50} cornersRef={cornersRef} videoSize={videoSize} />
    </>
  );
};

export default Corners;