import { cornersSelect } from "../../slices/cornersSlice";
import { CornersDict } from "../../types";
import Marker from "./marker";

const Corners = () => {
  const corners: CornersDict = cornersSelect();

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