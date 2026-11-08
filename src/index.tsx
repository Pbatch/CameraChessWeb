import i18n, { STORAGE_KEY as LANGUAGE_KEY } from "./i18n";
import Home from "./components/home/home";
import App from "./App";
import ErrorPage from "./components/common/errorPage";
import ModelLoader from "./components/common/modelLoader";
import RequireLichess from "./components/common/requireLichess";

import { createRoot } from 'react-dom/client';
import "./style/index.css";
import { createBrowserRouter, Navigate } from "react-router";
import { LINKED_HELP_STATE } from "./components/faq/faqPanel";
import type { ModeHandle } from "./utils/modes";
import { RouterProvider } from "react-router/dom";
import { registerSW } from "virtual:pwa-register";
import { VideoAndSidebar } from './components/common';

// add this to prompt for a refresh
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm(i18n.t("app.updateAvailable"))) {
      // The saved state may not suit the new version, but a language picked in the app still applies
      const language: string | null = localStorage.getItem(LANGUAGE_KEY);
      localStorage.clear();
      if (language !== null) localStorage.setItem(LANGUAGE_KEY, language);
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
            handle: { mode: "record" } satisfies ModeHandle,
            element: <VideoAndSidebar mode="record" />
          },
          {
            path: "/upload",
            handle: { mode: "upload" } satisfies ModeHandle,
            element: <VideoAndSidebar mode="upload" />
          }
        ]
      },
      {
        // Asks for a Lichess login first, so the model and camera only start once logged in
        element: <RequireLichess />,
        children: [
          {
            element: <ModelLoader />,
            children: [
              {
                path: "/broadcast",
                handle: { mode: "broadcast" } satisfies ModeHandle,
                element: <VideoAndSidebar mode="broadcast" />
              },
              {
                path: "/play",
                handle: { mode: "play" } satisfies ModeHandle,
                element: <VideoAndSidebar mode="play" />
              }
            ]
          }
        ]
      },
      {
        // A link to share, which opens the FAQ over the home page
        path: "/faq",
        element: <Navigate to="/" replace state={LINKED_HELP_STATE} />
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
