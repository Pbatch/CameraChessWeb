import { Dispatch, useEffect, useRef, useState } from "react";
import { NavigateFunction, Outlet, useNavigate } from "react-router-dom";
import { GraphModel } from "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import { ModelRefs } from "./types";
import { userSelect } from "./slices/userSlice";
import { useDispatch } from "react-redux";
import { lichessTrySetUser } from "./utils/lichess";
import { UnknownAction } from "@reduxjs/toolkit";
import { Toast } from "./components/common";

const App = () => {
  const dispatch: Dispatch<UnknownAction> = useDispatch();
  const navigate: NavigateFunction = useNavigate();
  const token = userSelect().token;
  const [loading, setLoading] = useState(true);

  const piecesModelRef = useRef<GraphModel | null>(null);
  const xcornersModelRef = useRef<GraphModel | null>(null);
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
      <Toast />
      {!loading && <Outlet context={modelRefs} />}
    </>
  );
};

export default App;
