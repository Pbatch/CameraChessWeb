import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { GraphModel } from "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import Auth from "./components/auth";
import { Context } from "./types";

const App = () => {
  const [loading, setLoading] = useState(true);

  const piecesModelRef = useRef<GraphModel>();
  const xcornersModelRef = useRef<GraphModel>();
  const authRef = useRef<Auth>(new Auth());
  const context: Context = {
    "piecesModelRef": piecesModelRef,
    "xcornersModelRef": xcornersModelRef,
    "authRef": authRef               
  }

  const loadAuth = async () => {
    await authRef.current.init();

    setLoading(false);
  }

  useEffect(() => {
    loadAuth();
  }, []);

  return (
    <>
      {!loading && <Outlet context={context}/>}
    </>
  );
};

export default App;