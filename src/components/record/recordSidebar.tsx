import { RecordButton, StopButton } from "./buttons";
import { Display, CornersButton, HomeButton, PgnButton, Sidebar, DigitalButton } from "../common";
import { setBoolean, setStringArray, setNumber, setString } from "../../types";
import FenButton from "../common/fenButton";
import BoardNumberInput from "./boardNumberInput";
import RoundInput from "./roundInput";

const RecordSidebar = ({ piecesModelRef, xcornersModelRef, videoRef, canvasRef, sidebarRef, 
  playing, setPlaying, text, setText, digital, setDigital, cornersRef, setBoardNumber, setRound }: {
  piecesModelRef: any, xcornersModelRef: any, videoRef: any, canvasRef: any, sidebarRef: any,
  playing: boolean, setPlaying: setBoolean, 
  text: string[], setText: setStringArray,
  digital: boolean, setDigital: setBoolean,
  cornersRef: any, setBoardNumber: setNumber, setRound: setString
}) => {
  return (
    <Sidebar sidebarRef={sidebarRef} >
      <li className="my-1">
        <CornersButton piecesModelRef={piecesModelRef} xcornersModelRef={xcornersModelRef} videoRef={videoRef} canvasRef={canvasRef} 
        setText={setText} />
      </li>
      <li className="my-1">
        <FenButton piecesModelRef={piecesModelRef} videoRef={videoRef} 
        canvasRef={canvasRef} setText={setText} cornersRef={cornersRef} />
      </li>
      <li className="my-1">
        <div className="btn-group w-100" role="group">
          <RecordButton playing={playing} setPlaying={setPlaying} />
          <StopButton setPlaying={setPlaying} setText={setText} />
        </div>
      </li>
      <li className="my-1">
        <div className="btn-group w-100" role="group">
          <BoardNumberInput setBoardNumber={setBoardNumber} />
          <RoundInput setRound={setRound} />
        </div>
      </li>
      <li className="border-top"></li>
      <li className="my-1">
        <Display text={text} />
      </li>
      <li className="border-top"></li>
      <li className="my-1">
        <div className="btn-group w-100" role="group">
          <DigitalButton digital={digital} setDigital={setDigital} />
          <PgnButton setText={setText} playing={playing} />
          <HomeButton />
        </div>
      </li>
    </Sidebar>
  );
};

export default RecordSidebar;