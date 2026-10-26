import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from "./components/home/home";
import FAQ from "./components/faq/faq";
import App from "./App";

import { createRoot } from 'react-dom/client';
import "./style/index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Provider } from 'react-redux';
import store from "./store.ts";
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
    children: [
      {
        path: "",
        element: <Home />,
      },
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

root.render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
);
