import * as tf from "@tensorflow/tfjs-core";
import { loadGraphModel, GraphModel } from "@tensorflow/tfjs-converter";
import { MODEL_HEIGHT, MODEL_WIDTH } from "../utils/constants";

const LoadModels = (piecesModelRef: any, xcornersModelRef: any) => {
  if ((piecesModelRef.current !== undefined) && (xcornersModelRef.current !== undefined)) {
    return;
  }

  tf.ready().then(async () => {
    tf.env().set('WEBGL_EXP_CONV', true);
    tf.env().set('WEBGL_PACK', false);
    tf.env().set('ENGINE_COMPILE_ONLY', true);

    const dummyInput: tf.Tensor<tf.Rank> = tf.zeros([1, MODEL_HEIGHT, MODEL_WIDTH, 3]);

    const piecesModel: GraphModel = await loadGraphModel("480M_pieces_float16/model.json");
    const piecesOutput: tf.Tensor<tf.Rank> | tf.Tensor<tf.Rank>[] = piecesModel.execute(dummyInput);

    const xcornersModel: GraphModel = await loadGraphModel("480L_xcorners_float16/model.json");
    const xcornersOutput: tf.Tensor<tf.Rank> | tf.Tensor<tf.Rank>[]  = xcornersModel.execute(dummyInput);

    tf.dispose([dummyInput, piecesOutput, xcornersOutput]);
    
    const backend: any = tf.backend()
    backend.checkCompileCompletion();
    backend.getUniformLocations();
    tf.env().set('ENGINE_COMPILE_ONLY', false);

    piecesModelRef.current = piecesModel;
    xcornersModelRef.current = xcornersModel;
  })
};

export default LoadModels;