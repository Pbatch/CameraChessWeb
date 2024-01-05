import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from "./components/home/home";
import Record from "./components/record/record";
import Export from "./components/export/export";
import Upload from "./components/upload/upload";
import Privacy from "./components/privacy/privacy";
import FAQ from "./components/faq/faq";
import App from "./App";

import { createRoot } from 'react-dom/client';
import "./style/index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Provider } from 'react-redux';
import store from "./store.tsx";
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
      },
      {
        path: "/faq",
        element: <FAQ />
      }
    ]
  }
]);

const root = createRoot(document.getElementById('root')!);
const persistor = persistStore(store);

root.render(
  <Provider store={store}>
    <PersistGate persistor={persistor}>
      <RouterProvider router={router} />
    </PersistGate>
  </Provider>
);
