import { Dispatch, useEffect, useRef, useState } from "react";
import { NavigateFunction, Outlet, useNavigate } from "react-router-dom";
import { GraphModel } from "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import { ModelRefs } from "./types";
import { userSelect } from "./slices/userSlice";
import { useDispatch } from "react-redux";
import { lichessTrySetUser } from "./utils/lichess";
import { AnyAction } from "redux";

const App = () => {
  const dispatch: Dispatch<AnyAction> = useDispatch();
  const navigate: NavigateFunction = useNavigate();
  const token = userSelect().token;
  const [loading, setLoading] = useState(true);
  
  const piecesModelRef = useRef<GraphModel>();
  const xcornersModelRef = useRef<GraphModel>();
  const modelRefs: ModelRefs = {
    "piecesModelRef": piecesModelRef,
    "xcornersModelRef": xcornersModelRef,           
  }

  useEffect(() => {
    if (token === "") {
      lichessTrySetUser(navigate, dispatch);
    }
    setLoading(false);
  }, []);

  return (
    <>
      {!loading && <Outlet context={modelRefs}/>}
    </>
  );
};

export default App;