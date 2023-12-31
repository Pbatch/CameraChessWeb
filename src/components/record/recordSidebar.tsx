import { RecordButton } from "./buttons";
import { Display, CornersButton, HomeButton, PgnButton, Sidebar, DigitalButton } from "../common";

const RecordSidebar = ({ piecesModelRef, xcornersModelRef, videoRef, canvasRef, sidebarRef, playing, setPlaying, text, setText,
digital, setDigital }: {
  piecesModelRef: any, xcornersModelRef: any, videoRef: any, canvasRef: any, sidebarRef: any,
  playing: boolean, setPlaying: React.Dispatch<React.SetStateAction<boolean>>, 
  text: string[], setText: React.Dispatch<React.SetStateAction<string[]>>,
  digital: boolean, setDigital: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  return (
    <Sidebar sidebarRef={sidebarRef} >
      <li className="my-1">
        <CornersButton piecesModelRef={piecesModelRef} xcornersModelRef={xcornersModelRef} videoRef={videoRef} canvasRef={canvasRef} 
        setText={setText} />
      </li>
      <li className="my-1">
        <RecordButton playing={playing} setPlaying={setPlaying} />
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
        <div className="btn-group w-100" role="group">
          <PgnButton setText={setText} playing={playing} />
          <HomeButton />
        </div>
      </li>
    </Sidebar>
  );
};

export default RecordSidebar;