import * as tf from "@tensorflow/tfjs-core";
import { loadGraphModel, GraphModel } from "@tensorflow/tfjs-converter";
import { MODEL_HEIGHT, MODEL_WIDTH } from "../utils/constants";

const LoadModels = async (piecesModelRef: any, xcornersModelRef: any) => {
  if (piecesModelRef.current && xcornersModelRef.current) {
    return;
  }

  await tf.ready();

  tf.env().set('WEBGL_EXP_CONV', true);
  tf.env().set('WEBGL_PACK', false);
  tf.env().set('ENGINE_COMPILE_ONLY', true);

  const dummyInput: tf.Tensor<tf.Rank> = tf.zeros([1, MODEL_HEIGHT, MODEL_WIDTH, 3]);

  const loadModel = async (modelPath: string): Promise<GraphModel> => {
    const model: GraphModel = await loadGraphModel(modelPath);
    const output: tf.Tensor<tf.Rank> | tf.Tensor<tf.Rank>[] = model.execute(dummyInput);
    tf.dispose([output]);
    return model;
  };

  const [piecesModel, xcornersModel] = await Promise.all([
    loadModel("480S_pieces_float16/model.json"),
    loadModel("480L_xcorners_float16/model.json"),
  ]);

  const backend: any = tf.backend();
  backend.checkCompileCompletion();
  backend.getUniformLocations();
  tf.env().set('ENGINE_COMPILE_ONLY', false);

  tf.dispose(dummyInput);

  piecesModelRef.current = piecesModel;
  xcornersModelRef.current = xcornersModel;
};

export default LoadModels;
