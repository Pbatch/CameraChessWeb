import "bootstrap/dist/css/bootstrap.min.css";
import "../../style/index.css";
import { act, createRef } from "react";
import type { ComponentProps, ComponentType } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { gameReducer, userReducer } from "../../slices";
import { gameSetClock } from "../../slices/gameSlice";
import { userSetToken } from "../../slices/userSlice";
import Container from "./container";
import RecordSidebar from "../record/recordSidebar";
import UploadSidebar from "../upload/uploadSidebar";
import BroadcastSidebar from "../broadcast/broadcastSidebar";
import PlaySidebar from "../play/playSidebar";

// A Pixel 7a in landscape: 915 x 412 CSS px, less Chrome's status bar and toolbar
const PHONE_WIDTH = 915;
const PHONE_HEIGHT = 330;

const ICONS_CSS = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

type SidebarComponent = ComponentType<ComponentProps<typeof RecordSidebar> & ComponentProps<typeof UploadSidebar>
  & ComponentProps<typeof BroadcastSidebar> & ComponentProps<typeof PlaySidebar>>;

const SIDEBARS: [string, SidebarComponent][] = [
  ["record", RecordSidebar as SidebarComponent],
  ["upload", UploadSidebar as SidebarComponent],
  ["broadcast", BroadcastSidebar as SidebarComponent],
  ["play", PlaySidebar as SidebarComponent],
];

let root: Root | null = null;
let host: HTMLDivElement | null = null;

const renderSidebar = async (Sidebar: SidebarComponent, playing: boolean): Promise<HTMLElement> => {
  // Signed in, so Export shows, and with a clock, so the preview is as tall as it gets
  const store = configureStore({ reducer: combineReducers({ game: gameReducer, user: userReducer }) });
  store.dispatch(userSetToken("token"));
  store.dispatch(gameSetClock({ wtime: 600000, btime: 600000, turn: "w", updatedAt: Date.now(), running: false }));

  const noop = () => {};
  const props = {
    videoRef: createRef<HTMLVideoElement>(),
    chessqueriesModelRef: { current: null },
    playing, setPlaying: noop,
    text: ["Starting game", "White vs DrNykterstein"], setText: noop,
    roi: null, setRoi: noop,
    selecting: false, setSelecting: noop,
    canPlay: true,
    study: null, setStudy: noop,
    setBoardNumber: noop,
  };

  host = document.createElement("div");
  host.style.height = "100vh";
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root?.render(
      <Provider store={store}>
        <MemoryRouter>
          <Container className="video-and-sidebar">
            <Sidebar {...props} />
          </Container>
        </MemoryRouter>
      </Provider>
    );
  });

  const sidebar = host.querySelector<HTMLElement>(".sidebar");
  if (sidebar === null) {
    throw new Error("Sidebar did not render");
  }
  return sidebar;
}

describe("sidebar on a landscape phone", () => {
  beforeAll(async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    // Lichess calls (studies, games) get an empty reply
    vi.stubGlobal("fetch", async () => new Response("", { status: 200 }));
    document.body.style.margin = "0";

    // Icons set the height of icon-only buttons, so measure with the real font
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = ICONS_CSS;
    await new Promise((resolve) => {
      link.onload = resolve;
      link.onerror = resolve;
      document.head.appendChild(link);
    });

    await page.viewport(PHONE_WIDTH, PHONE_HEIGHT);
  });

  afterEach(() => {
    act(() => root?.unmount());
    host?.remove();
    root = null;
    host = null;
  });

  for (const [mode, Sidebar] of SIDEBARS) {
    for (const playing of [false, true]) {
      it(`fits without scrolling in ${mode} mode while ${playing ? "detecting" : "setting up"}`, async () => {
        const sidebar = await renderSidebar(Sidebar, playing);
        await document.fonts.ready;

        expect(sidebar.clientHeight).toBe(PHONE_HEIGHT);
        expect(sidebar.scrollHeight).toBeLessThanOrEqual(sidebar.clientHeight);
        // Buttons that don't wrap their labels must still fit across
        expect(sidebar.scrollWidth).toBeLessThanOrEqual(sidebar.clientWidth);
      });
    }
  }
});
