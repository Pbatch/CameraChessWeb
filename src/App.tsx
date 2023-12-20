import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { GraphModel } from "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import Auth from "./components/auth";

const App = () => {
  const [loading, setLoading] = useState(true);

  const piecesModelRef = useRef<GraphModel>();
  const xcornersModelRef = useRef<GraphModel>();
  const authRef = useRef(null);
  const context = {
    "piecesModelRef": piecesModelRef,
    "xcornersModelRef": xcornersModelRef,
    "authRef": authRef               
  }

  const loadAuth = async () => {
    const auth = new Auth();
    await auth.init();
    authRef.current = auth;

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