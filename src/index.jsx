import React from "react";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from "./components/home/home.jsx";
import Record from "./components/record/record.jsx";
import Export from "./components/export/export.jsx";
import Upload from "./components/upload/upload.jsx";
import Privacy from "./components/privacy/privacy.jsx";
import App from "./App.jsx";

import { createRoot } from 'react-dom/client';
import "./style/index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Provider } from 'react-redux';
import store from "./store.jsx";
import { persistStore } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";
import { registerSW } from "virtual:pwa-register";

// add this to prompt for a refresh
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("New content available. Reload?")) {
      updateSW(true);
    }
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: "/record",
        element: <Record />
      },
      {
        path: "/export",
        element: <Export />
      },
      {
        path: "/upload",
        element: <Upload />
      },
      {
        path: "/privacy",
        element: <Privacy />
      }
    ]
  }
]);

const root = createRoot(document.getElementById('root'));
let persistor = persistStore(store);

root.render(
  <Provider store={store}>
    <PersistGate persistor={persistor}>
      <RouterProvider router={router} />
    </PersistGate>
  </Provider>
);
