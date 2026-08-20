import { type Dispatch, useEffect, useRef, useState } from "react";
import { type NavigateFunction, Outlet, useNavigate } from "react-router-dom";
import type { GraphModel } from "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import type { ModelRefs } from "./types";
import { useUser } from "./slices/userSlice";
import { useDispatch } from "react-redux";
import { lichessTrySetUser } from "./utils/lichess";
import type { UnknownAction } from "@reduxjs/toolkit";
import { Toast } from "./components/common";
import LoadModels from "./utils/loadModels";

const App = () => {
  const dispatch: Dispatch<UnknownAction> = useDispatch();
  const navigate: NavigateFunction = useNavigate();
  const token = useUser().token;
  const [loading, setLoading] = useState(true);

  const piecesModelRef = useRef<GraphModel | null>(null);
  const xcornersModelRef = useRef<GraphModel | null>(null);
  const modelRefs: ModelRefs = {
    "piecesModelRef": piecesModelRef,
    "xcornersModelRef": xcornersModelRef,
  }

  useEffect(() => {
    if (token === "") {
      void lichessTrySetUser(navigate, dispatch)
        .catch((error: unknown) => console.error("Failed to restore Lichess session", error));
    }
  }, [dispatch, navigate, token]);

  useEffect(() => {
    LoadModels(piecesModelRef, xcornersModelRef)
      .then(() => setLoading(false))
      .catch((error) => console.error("Failed to load TensorFlow models", error));
  }, []);

  return (
    <>
      <Toast />
      {!loading && <Outlet context={modelRefs} />}
    </>
  );
};

export default App;
