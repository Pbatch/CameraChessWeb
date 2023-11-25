import { findCorners } from "../../utils/findCorners";
import { useDispatch } from 'react-redux';

const CornersButton = ({ piecesModelRef, xcornersModelRef, webcamRef, canvasRef, setText, loading }) => {
  const dispatch = useDispatch();

  const handleClick = (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    findCorners(piecesModelRef, xcornersModelRef, webcamRef, canvasRef, dispatch, setText);
  }

  return (
    <button className="btn btn-dark btn-sm btn-outline-light" onClick={handleClick}>
      Find Corners
    </button>
  );
};

export default CornersButton;