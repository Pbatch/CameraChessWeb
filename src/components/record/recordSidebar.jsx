import Display from "../common/display.jsx";
import RecordButton from "./recordButton.jsx";
import PgnButton from "../common/pgnButton.jsx";
import HelpButton from "./helpButton.jsx";
import CornersButton from "../common/cornersButton.jsx";
import HomeButton from "../common/homeButton.jsx";

const RecordSidebar = ({ piecesModelRef, xcornersModelRef, webcamRef, canvasRef, sidebarRef, recording, setRecording, text, setText }) => {
  return (
    <div ref={sidebarRef} className="d-flex flex-column text-center px-1" style={{"width": "150px"}}>
      <ul className="nav nav-pills flex-column">
        <li className="my-1">
          <CornersButton piecesModelRef={piecesModelRef} xcornersModelRef={xcornersModelRef} webcamRef={webcamRef} canvasRef={canvasRef} 
          setText={setText} />
        </li>
        <li className="my-1">
          <RecordButton recording={recording} setRecording={setRecording} />
        </li>
        <li className="border-top"></li>
        <li className="my-1">
          <Display text={text} />
        </li>
        <li className="border-top"></li>
        <li className="my-1">
          <PgnButton setText={setText} recording={recording} />
        </li>
        {/* <li className="my-1">
          <HelpButton />
        </li> */}
        <li className="my-1">
          <HomeButton />
        </li>
        
      </ul>
    </div>
  );
};

export default RecordSidebar;