import "../../style/index.css";
import i18n, { resources } from "../../i18n";
import type { Language } from "../../i18n";
import { act, createRef } from "react";
import type { ComponentProps, ComponentType } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { ModeHandle } from "../../utils/modes";
import type { Mode } from "../../types";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { useStore } from "../../store";
import { clockSet } from "../../slices/clockSlice";
import { userSet } from "../../slices/userSlice";
import Container from "./container";
import Header from "./header";
import RecordSidebar from "../record/recordSidebar";
import UploadSidebar from "../upload/uploadSidebar";
import BroadcastSidebar from "../broadcast/broadcastSidebar";
import PlaySidebar from "../play/playSidebar";

// A Pixel 7a in landscape: 915 x 412 CSS px, less Chrome's status bar and toolbar
const PHONE_WIDTH = 915;
const PHONE_HEIGHT = 330;

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

type SidebarComponent = ComponentType<ComponentProps<typeof RecordSidebar> & ComponentProps<typeof UploadSidebar>
  & ComponentProps<typeof BroadcastSidebar> & ComponentProps<typeof PlaySidebar>>;

const SIDEBARS: [Mode, SidebarComponent][] = [
  ["record", RecordSidebar as SidebarComponent],
  ["upload", UploadSidebar as SidebarComponent],
  ["broadcast", BroadcastSidebar as SidebarComponent],
  ["play", PlaySidebar as SidebarComponent],
];

let root: Root | null = null;
let host: HTMLDivElement | null = null;

const renderSidebar = async (mode: Mode, Sidebar: SidebarComponent, playing: boolean): Promise<HTMLElement> => {
  // Signed in, so Export shows, and in play mode, the only one with a clock, a clock
  userSet({ token: "token", username: "" });
  if (Sidebar === (PlaySidebar as SidebarComponent)) {
    clockSet({ wtime: 600000, btime: 600000, turn: "w", updatedAt: Date.now(), running: false });
  }

  const noop = () => {};
  const props = {
    videoRef: createRef<HTMLVideoElement>(),
    camera: { devices: [], deviceId: null, selectDevice: noop },
    modelRef: { current: null },
    playing, setPlaying: noop,
    text: ["Starting game", "White vs DrNykterstein"], setText: noop,
    roi: null, setRoi: noop,
    selecting: false, setSelecting: noop,
    canPlay: true,
    study: null, setStudy: noop,
    boardNumber: -1, setBoardNumber: noop,
    setGameSelected: noop,
  };

  host = document.createElement("div");
  host.style.height = "100vh";
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    // Laid out as in App, with the data router it uses: the header, and the page below it
    const router = createMemoryRouter([{
      path: `/${mode}`,
      handle: { mode } satisfies ModeHandle,
      element: (
        <div className="flex h-full flex-col">
          <Header />
          <div className="min-h-0 flex-1">
            <Container className="video-and-sidebar">
              <Sidebar {...props} />
            </Container>
          </div>
        </div>
      ),
    }], { initialEntries: [`/${mode}`] });
    root?.render(<RouterProvider router={router} />);
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

    await page.viewport(PHONE_WIDTH, PHONE_HEIGHT);
  });

  afterEach(() => {
    act(() => root?.unmount());
    host?.remove();
    root = null;
    host = null;
    useStore.setState(useStore.getInitialState(), true);
  });

  afterAll(async () => {
    await i18n.changeLanguage("en");
  });

  // Translations run longer than English
  for (const language of Object.keys(resources) as Language[]) for (const [mode, Sidebar] of SIDEBARS) {
    for (const playing of [false, true]) {
      // Paused, broadcast and play show the board beside setup too long to fit with it, so their sidebars scroll
      if ((mode === "broadcast" || mode === "play") && !playing) continue;
      it(`fits without scrolling in ${mode} mode while ${playing ? "detecting" : "setting up"} (${language})`, async () => {
        await i18n.changeLanguage(language);
        const sidebar = await renderSidebar(mode, Sidebar, playing);
        await document.fonts.ready;

        // All the height the header leaves
        const header = document.querySelector<HTMLElement>(".app-header");
        expect(sidebar.clientHeight).toBe(PHONE_HEIGHT - (header?.offsetHeight ?? 0));
        expect(sidebar.scrollHeight).toBeLessThanOrEqual(sidebar.clientHeight);
        // Buttons that don't wrap their labels must still fit across
        expect(sidebar.scrollWidth).toBeLessThanOrEqual(sidebar.clientWidth);
      });
    }
  }
});
