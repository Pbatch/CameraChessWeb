import Display from "../common/display.jsx";
import RecordButton from "./recordButton.jsx";
import PgnButton from "./pgnButton.jsx";
import HelpButton from "./helpButton.jsx";
import CornersButton from "./cornersButton.jsx";
import NavUploadButton from "./navUploadButton.jsx";

const RecordSidebar = ({ piecesModelRef, xcornersModelRef, webcamRef, canvasRef, sidebarRef, recording, setRecording, text, setText, loading }) => {
  return (
    <div ref={sidebarRef} className="d-flex flex-column text-center bg-dark">
      <div className="navbar-brand text-light h1 my-2">
        ChessCam
      </div>
      <ul className="nav nav-pills flex-column">
        <li className="border-top"></li>
        <li className="my-2">
          <CornersButton piecesModelRef={piecesModelRef} xcornersModelRef={xcornersModelRef} webcamRef={webcamRef} canvasRef={canvasRef} 
          setText={setText} loading={loading} />
        </li>
        <li className="my-2">
          <RecordButton recording={recording} setRecording={setRecording} loading={loading} />
        </li>
        <li className="border-top"></li>
        <li className="my-2">
          <Display text={text} />
        </li>
        <li className="border-top"></li>
        <li className="my-2">
          <PgnButton setText={setText} recording={recording} />
        </li>
        <li className="my-2">
          <HelpButton />
        </li>
        <li className="border-top"></li>
        <li className="my-2">
          <NavUploadButton />
        </li>
        
      </ul>
    </div>
  );
};

export default RecordSidebar;