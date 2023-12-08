import Marker from "./marker.jsx";
import { useSelector } from "react-redux";

const Corners = () => {
  const corners = useSelector(state => state.corners.value);

  return (
    <>
      <Marker name="a8" xy={corners.a8} />
      <Marker name="h8" xy={corners.h8} />
      <Marker name="h1" xy={corners.h1} />
      <Marker name="a1" xy={corners.a1} />
    </>
  );
};

export default Corners;