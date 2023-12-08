import { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import * as tf from "@tensorflow/tfjs";
import * as Constants from "./utils/constants.jsx";
import Loader from "./components/loader.jsx";

const App = () => {
  const [loading, setLoading] = useState({ loading: true, progress: 0 });
  const piecesModelRef = useRef(null);
  const xcornersModelRef = useRef(null);

  useEffect(() => {
    tf.ready().then(async () => {
      console.info(`Backend: ${tf.getBackend()}`);

      const dummyInput = tf.zeros([1, Constants.MODEL_SIZE, Constants.MODEL_SIZE, 3]);

      const piecesModel = await tf.loadGraphModel(
        "480N_web_model/model.json",
        {
          onProgress: (fractions) => {
            setLoading({ loading: true, progress: fractions / 4 });
          },
        }
      );
      const piecesOutput = piecesModel.execute(dummyInput);
      setLoading({ loading: true, progress: 0.5 })

      const xcornersModel = await tf.loadGraphModel(
        "480L_xcorner_web_model/model.json",
        {
          onProgress: (fractions) => {
            setLoading({ loading: true, progress: 0.5 + fractions / 4})
          }
        }  
      );
      const xcornersOutput = xcornersModel.execute(dummyInput);

      piecesModelRef.current = piecesModel;
      xcornersModelRef.current = xcornersModel;

      tf.dispose([dummyInput, piecesOutput, xcornersOutput]);

      setLoading({ loading: false, progress: 1.0 });
    });
  }, []);

  return (
    <>
       {loading.loading && <Loader progress={loading.progress} />}
       {!loading.loading && <Outlet context={[piecesModelRef, xcornersModelRef]}/>}
    </>
  );
};

export default App;