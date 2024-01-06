import { findCorners } from "../../utils/findCorners";
import { useDispatch } from 'react-redux';
import SidebarButton from "./sidebarButton";

const CornersButton = ({ piecesModelRef, xcornersModelRef, videoRef, canvasRef, setText}: 
  {piecesModelRef: any, xcornersModelRef: any, videoRef: any, canvasRef: any, setText: any}) => {
  const dispatch = useDispatch();

  const handleClick = (e: any) => {
    e.preventDefault();

    findCorners(piecesModelRef, xcornersModelRef, videoRef, canvasRef, dispatch, setText);
  }

  return (
    <SidebarButton onClick={handleClick}>
      Find Corners
    </SidebarButton>
  );
};

export default CornersButton;