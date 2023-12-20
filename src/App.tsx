import { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import * as tf from "@tensorflow/tfjs-core";
import { loadGraphModel, GraphModel } from "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import { MODEL_HEIGHT, MODEL_WIDTH } from "./utils/constants.jsx";
import Loader from "./components/loader.jsx";
import Auth from "./components/auth.jsx"

const App = () => {
  const [loading, setLoading] = useState({ loading: true, progress: 0 });
  const piecesModelRef = useRef<GraphModel>();
  const xcornersModelRef = useRef<GraphModel>();
  const authRef = useRef(null);
  const context = {
    "piecesModelRef": piecesModelRef,
    "xcornersModelRef": xcornersModelRef,
    "authRef": authRef               
  }

  useEffect(() => {
    tf.ready().then(async () => {
      const auth = new Auth();
      await auth.init();
      authRef.current = auth;
      
      tf.env().set('WEBGL_EXP_CONV', true);
      tf.env().set('ENGINE_COMPILE_ONLY', true);

      const dummyInput = tf.zeros([1, MODEL_HEIGHT, MODEL_WIDTH, 3]);

      const piecesModel = await loadGraphModel(
        "pieces_640S_float16/model.json",
        {
          onProgress: (fractions) => {
            setLoading({ loading: true, progress: fractions / 4 });
          },
        }
      );
      const piecesOutput = piecesModel.execute(dummyInput);
      setLoading({ loading: true, progress: 0.5 })

      const xcornersModel = await loadGraphModel(
        "xcorners_640L_float16/model.json",
        {
          onProgress: (fractions) => {
            setLoading({ loading: true, progress: 0.5 + fractions / 4})
          }
        }  
      );
      const xcornersOutput = xcornersModel.execute(dummyInput);

      tf.dispose([dummyInput, piecesOutput, xcornersOutput]);
      
      const backend: any = tf.backend()
      backend.checkCompileCompletion();
      backend.getUniformLocations();
      tf.env().set('ENGINE_COMPILE_ONLY', false);

      piecesModelRef.current = piecesModel;
      xcornersModelRef.current = xcornersModel;

      setLoading({ loading: false, progress: 1.0 });
    });
  }, []);

  return (
    <>
      {loading.loading && <Loader progress={loading.progress} />}
      {!loading.loading && <Outlet context={context}/>}
    </>
  );
};

export default App;