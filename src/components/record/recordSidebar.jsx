import { RecordButton } from "./buttons";
import { Display, CornersButton, HomeButton, PgnButton, Sidebar, DigitalButton } from "../common";

const RecordSidebar = ({ piecesModelRef, xcornersModelRef, webcamRef, canvasRef, sidebarRef, recording, setRecording, text, setText,
digital, setDigital }) => {
  return (
    <Sidebar sidebarRef={sidebarRef} >
      <li className="my-1">
        <CornersButton piecesModelRef={piecesModelRef} xcornersModelRef={xcornersModelRef} webcamRef={webcamRef} canvasRef={canvasRef} 
        setText={setText} />
      </li>
      <li className="my-1">
        <RecordButton recording={recording} setRecording={setRecording} />
      </li>
      <li className="my-1">
        <DigitalButton digital={digital} setDigital={setDigital} />
      </li>
      <li className="border-top"></li>
      <li className="my-1">
        <Display text={text} />
      </li>
      <li className="border-top"></li>
      <li className="my-1">
        <PgnButton setText={setText} recording={recording} />
      </li>
      <li className="my-1">
        <HomeButton />
      </li>
    </Sidebar>
  );
};

export default RecordSidebar;