import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Home from "./components/home/home";
import FAQ from "./components/faq/faq";
import App from "./App";
import ErrorPage from "./components/common/errorPage";
import ModelLoader from "./components/common/modelLoader";

import { createRoot } from 'react-dom/client';
import "./style/index.css";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { registerSW } from "virtual:pwa-register";
import { VideoAndSidebar } from './components/common';

// add this to prompt for a refresh
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("New content available. Reload?")) {
      localStorage.clear();
      void updateSW(true);
    }
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        // Only the routes that read the board wait for the model
        element: <ModelLoader />,
        children: [
          {
            path: "/record",
            element: <VideoAndSidebar mode="record" />
          },
          {
            path: "/upload",
            element: <VideoAndSidebar mode="upload" />
          },
          {
            path: "/broadcast",
            element: <VideoAndSidebar mode="broadcast" />
          },
          {
            path: "/play",
            element: <VideoAndSidebar mode="play" />
          }
        ]
      },
      {
        path: "/faq",
        element: <FAQ />
      }
    ]
  }
]);

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error("Unable to find the application root element");
}
const root = createRoot(rootElement);

root.render(<RouterProvider router={router} />);
