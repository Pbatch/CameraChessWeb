import { useState, useEffect, useRef } from "react";
import Video from "./video";
import RecordSidebar from "./recordSidebar.jsx";
import * as tf from "@tensorflow/tfjs";
import * as Constants from "../../utils/constants.jsx";

const Record = () => {
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState([]);
  const [loading, setLoading] = useState(true);

  const recordingRef = useRef(recording);
  const sidebarRef = useRef(null);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const piecesModelRef = useRef(null);
  const xcornersModelRef = useRef(null);

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);
  
  useEffect(() => {
    tf.ready().then(async () => {
      setLoading(true);
      setText(["Loading models"]);

      console.info(`Backend: ${tf.getBackend()}`);

      const dummyInput = tf.zeros([1, Constants.MODEL_SIZE, Constants.MODEL_SIZE, 3]);

      const piecesModel = await tf.loadGraphModel("480N_web_model/model.json");
      const piecesOutput = piecesModel.execute(dummyInput);

      const xcornersModel = await tf.loadGraphModel("480L_xcorner_web_model/model.json");
      const xcornersOutput = xcornersModel.execute(dummyInput);

      piecesModelRef.current = piecesModel;
      xcornersModelRef.current = xcornersModel;

      tf.dispose([dummyInput, piecesOutput, xcornersOutput]);
      
      setText(["Align the corners", "Start recording"]);
      setLoading(false);
      
    });
  }, []);

  return (
    <div className="d-flex">
      <RecordSidebar piecesModelRef={piecesModelRef} xcornersModelRef={xcornersModelRef} 
      canvasRef={canvasRef} webcamRef={webcamRef} sidebarRef={sidebarRef} recording={recording} setRecording={setRecording} text={text} setText={setText}
      loading={loading} />
      <Video modelRef={piecesModelRef} canvasRef={canvasRef} recordingRef={recordingRef} setText={setText} sidebarRef={sidebarRef} webcamRef={webcamRef} />
    </div>
  );
};

export default Record;
