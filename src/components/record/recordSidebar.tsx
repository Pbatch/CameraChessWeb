import { CornersButton, Sidebar, RecordButton, StopButton, FenButton, DeviceButton } from "../common";
import { SetBoolean, SetStringArray } from "../../types";

const RecordSidebar = ({ piecesModelRef, xcornersModelRef, videoRef, canvasRef, sidebarRef, 
  playing, setPlaying, text, setText, cornersRef }: {
  piecesModelRef: any, xcornersModelRef: any, videoRef: any, canvasRef: any, sidebarRef: any,
  playing: boolean, setPlaying: SetBoolean, 
  text: string[], setText: SetStringArray,
  cornersRef: any
}) => {
  const inputStyle = {
    display: playing ? "none": "inline-block"
  }
  return (
    <Sidebar sidebarRef={sidebarRef} playing={playing} text={text} setText={setText} >
      <li className="my-1" style={inputStyle}>
        <DeviceButton videoRef={videoRef} />
      </li>
      <li className="my-1" style={inputStyle}>
        <CornersButton piecesModelRef={piecesModelRef} xcornersModelRef={xcornersModelRef} videoRef={videoRef} canvasRef={canvasRef} 
        setText={setText} />
      </li>
      <li className="my-1" style={inputStyle}>
        <FenButton piecesModelRef={piecesModelRef} videoRef={videoRef} 
        canvasRef={canvasRef} setText={setText} cornersRef={cornersRef} />
      </li>
      <li className="my-1">
        <div className="btn-group w-100" role="group">
          <RecordButton playing={playing} setPlaying={setPlaying} />
          <StopButton setPlaying={setPlaying} setText={setText} />
        </div>
      </li>
    </Sidebar>
  );
};

export default RecordSidebar;