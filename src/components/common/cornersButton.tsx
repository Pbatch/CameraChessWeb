import { findCorners } from "../../utils/findCorners";
import { useDispatch } from 'react-redux';
import SidebarButton from "./sidebarButton";
import type { CanvasRef, ModelRefs, SetStringArray, VideoRef } from "../../types";

const CornersButton = ({ piecesModelRef, xcornersModelRef, videoRef, canvasRef, setText}: 
  ModelRefs & { videoRef: VideoRef, canvasRef: CanvasRef, setText: SetStringArray }) => {
  const dispatch = useDispatch();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    void findCorners(piecesModelRef, xcornersModelRef, videoRef, canvasRef, dispatch, setText)
      .catch((error: unknown) => {
        console.error("Unable to find chessboard corners", error);
        setText(["Unable to find chessboard corners"]);
      });
  }

  return (
    <SidebarButton onClick={handleClick}>
      Find Corners
    </SidebarButton>
  );
};

export default CornersButton;
