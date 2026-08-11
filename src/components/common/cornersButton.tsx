import { findCorners } from "../../utils/findCorners";
import { useDispatch } from 'react-redux';
import SidebarButton from "./sidebarButton";
import { useState } from "react";

const CornersButton = ({ piecesModelRef, xcornersModelRef, videoRef, canvasRef, setText}: 
  {piecesModelRef: any, xcornersModelRef: any, videoRef: any, canvasRef: any, setText: any}) => {
  const dispatch = useDispatch();
  const [finding, setFinding] = useState(false);

  const handleClick = (e: any) => {
    e.preventDefault();
    if (finding) return;
    setFinding(true);

    void findCorners(piecesModelRef, xcornersModelRef, videoRef, canvasRef, dispatch, setText)
      .catch((error: unknown) => {
        console.error("Unable to find chessboard corners", error);
        setText(["Unable to find chessboard corners"]);
      })
      .finally(() => setFinding(false));
  }

  return (
    <SidebarButton onClick={handleClick} disabled={finding}>
      {finding ? "Finding Corners..." : "Find Corners"}
    </SidebarButton>
  );
};

export default CornersButton;
