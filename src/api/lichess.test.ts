import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NavigateFunction } from "react-router";
import { MemoryStorage } from "../test/helpers";

const origin = "https://chesscam.example";

const stubLocation = (search: string = "") => {
  const location = { protocol: "https:", host: "chesscam.example", search, assign: vi.fn() };
  vi.stubGlobal("location", location);
  return location;
}

const loadLichess = () => import("./lichess");
// The store the last loaded lichess module saves the user to
const loadUser = async () => (await import("../store")).useStore.getState().user;

const sha256Base64Url = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const startLogin = async () => {
  const location = stubLocation();
  await (await loadLichess()).lichessLogin();
  return new URL(location.assign.mock.calls[0][0] as string);
}

describe("Lichess OAuth", () => {
  let storage: MemoryStorage;
  let navigate: NavigateFunction;

  beforeEach(() => {
    vi.resetModules();
    storage = new MemoryStorage();
    vi.stubGlobal("sessionStorage", storage);
    navigate = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects to Lichess with a PKCE challenge for the stored verifier", async () => {
    const url = await startLogin();
    const { verifier, state } = JSON.parse(storage.getItem("lichess-oauth-pkce") ?? "");

    expect(`${url.origin}${url.pathname}`).toBe("https://lichess.org/oauth");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      response_type: "code",
      client_id: "camera-chess-web",
      redirect_uri: `${origin}/`,
      code_challenge_method: "S256",
      code_challenge: await sha256Base64Url(verifier),
      scope: "study:write study:read board:play",
      state
    });
  });

  it("exchanges the code for a token and loads the account", async () => {
    const url = await startLogin();
    const { verifier } = JSON.parse(storage.getItem("lichess-oauth-pkce") ?? "");

    vi.resetModules();
    stubLocation(`?code=liu_code&state=${url.searchParams.get("state")}`);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ access_token: "lio_token" }))
      .mockResolvedValueOnce(Response.json({ username: "magnus" }));
    vi.stubGlobal("fetch", fetchMock);

    await (await loadLichess()).lichessTrySetUser(navigate);

    const [tokenUrl, tokenRequest] = fetchMock.mock.calls[0];
    expect(tokenUrl).toBe("https://lichess.org/api/token");
    expect(Object.fromEntries(tokenRequest.body as URLSearchParams)).toEqual({
      grant_type: "authorization_code",
      code: "liu_code",
      code_verifier: verifier,
      redirect_uri: `${origin}/`,
      client_id: "camera-chess-web"
    });
    expect(await loadUser()).toEqual({ token: "lio_token", username: "magnus" });
    expect(navigate).toHaveBeenCalledWith("/");
    expect(storage.getItem("lichess-oauth-pkce")).toBeNull();
  });

  const loginReturningTo = async (returnTo: string, accountResponse: Response) => {
    const location = stubLocation();
    await (await loadLichess()).lichessLogin(returnTo);
    const state = new URL(location.assign.mock.calls[0][0] as string).searchParams.get("state");
    vi.resetModules();
    stubLocation(`?code=liu_code&state=${state}`);
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(Response.json({ access_token: "lio_token" }))
      .mockResolvedValueOnce(accountResponse));
    return loadLichess();
  }

  it("opens the page that asked for the login once logged in", async () => {
    const { lichessTrySetUser } = await loginReturningTo("/play", Response.json({ username: "magnus" }));

    await lichessTrySetUser(navigate);

    expect(navigate).toHaveBeenCalledWith("/play");
  });

  it("returns home rather than to the page that asked when the login fails", async () => {
    const { lichessTrySetUser } = await loginReturningTo("/play", new Response("down", { status: 503 }));

    await expect(lichessTrySetUser(navigate)).rejects.toMatchObject({ status: 503 });

    expect(navigate).toHaveBeenCalledWith("/");
  });

  it("never returns to another site", async () => {
    const { lichessTrySetUser } = await loginReturningTo("//evil.example", Response.json({ username: "magnus" }));

    await lichessTrySetUser(navigate);

    expect(navigate).toHaveBeenCalledWith("/");
  });

  it("rejects a mismatched state without requesting a token", async () => {
    await startLogin();
    vi.resetModules();
    stubLocation("?code=liu_code&state=forged");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect((await loadLichess()).lichessTrySetUser(navigate)).rejects.toThrow("state mismatch");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await loadUser()).toEqual({ token: "", username: "" });
    expect(navigate).toHaveBeenCalledWith("/");
  });

  it("returns home quietly when the user cancels", async () => {
    await startLogin();
    vi.resetModules();
    stubLocation("?error=access_denied&state=whatever");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await (await loadLichess()).lichessTrySetUser(navigate);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/");
  });

  it("keeps the user logged out when the account lookup fails", async () => {
    const url = await startLogin();
    vi.resetModules();
    stubLocation(`?code=liu_code&state=${url.searchParams.get("state")}`);
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(Response.json({ access_token: "lio_token" }))
      .mockResolvedValueOnce(new Response("down", { status: 503 })));

    await expect((await loadLichess()).lichessTrySetUser(navigate)).rejects.toMatchObject({ status: 503 });

    expect(await loadUser()).toEqual({ token: "", username: "" });
    expect(navigate).toHaveBeenCalledWith("/");
  });

  it("only exchanges a code once", async () => {
    const url = await startLogin();
    vi.resetModules();
    stubLocation(`?code=liu_code&state=${url.searchParams.get("state")}`);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ access_token: "lio_token" }))
      .mockResolvedValueOnce(Response.json({ username: "magnus" }));
    vi.stubGlobal("fetch", fetchMock);
    const { lichessTrySetUser } = await loadLichess();

    await lichessTrySetUser(navigate);
    await lichessTrySetUser(navigate);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does nothing on a normal page load", async () => {
    stubLocation();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await (await loadLichess()).lichessTrySetUser(navigate);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe("Lichess game stream", () => {
  const gameFull = { type: "gameFull", state: { moves: "e2e4" } };
  const gameState = { type: "gameState", moves: "e2e4 e7e5" };
  const ndjson = (...events: object[]) => new Response(events.map((event) => `${JSON.stringify(event)}\n`).join(""));
  const makeHandlers = () => ({ onEvent: vi.fn(), onConnect: vi.fn(), onDisconnect: vi.fn(), onEventError: vi.fn() });

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    stubLocation();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("reports a dropped connection and reconnects", async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(ndjson(gameFull));
    vi.stubGlobal("fetch", fetchMock);
    const handlers = makeHandlers();

    (await loadLichess()).lichessStreamGame("lio_token", "game1", handlers);
    await vi.advanceTimersByTimeAsync(0);
    expect(handlers.onDisconnect).toHaveBeenCalledWith(expect.any(TypeError), true);
    expect(handlers.onConnect).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(handlers.onConnect).toHaveBeenCalledTimes(1);
    expect(handlers.onEvent).toHaveBeenCalledWith(gameFull);
  });

  it("does not reconnect when Lichess refuses the stream", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    const handlers = makeHandlers();

    (await loadLichess()).lichessStreamGame("lio_token", "game1", handlers);
    await vi.advanceTimersByTimeAsync(60000);

    expect(handlers.onDisconnect).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }), false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports an event it cannot handle and carries on, without reconnecting", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ndjson(gameFull, gameState));
    vi.stubGlobal("fetch", fetchMock);
    const handlers = makeHandlers();
    handlers.onEvent.mockImplementationOnce(() => { throw new Error("illegal"); });

    (await loadLichess()).lichessStreamGame("lio_token", "game1", handlers);
    await vi.advanceTimersByTimeAsync(60000);

    expect(handlers.onEventError).toHaveBeenCalledWith(expect.objectContaining({ message: "illegal" }));
    expect(handlers.onEvent).toHaveBeenCalledWith(gameState);
    expect(handlers.onDisconnect).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops reconnecting once aborted", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    const controller = (await loadLichess()).lichessStreamGame("lio_token", "game1", makeHandlers());
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    await vi.advanceTimersByTimeAsync(60000);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("describeLichessError", () => {
  it.each([
    [401, "log in again"],
    [429, "limiting requests"],
    [503, "having problems"],
    [418, "refused the request (418)"]
  ])("explains a %i", async (status, text) => {
    const { describeLichessError, LichessError } = await loadLichess();
    expect(describeLichessError(new LichessError(status, ""))).toContain(text);
  });

  it("gives Lichess's reason for a refusal", async () => {
    const { describeLichessError, LichessError } = await loadLichess();
    expect(describeLichessError(new LichessError(400, "", "Not your turn"))).toBe("Lichess refused the request: Not your turn");
  });

  it.each([
    ['{"error":"Piece on e2 cannot move to e5"}', "Piece on e2 cannot move to e5"],
    ["Bad request ", "Bad request"]
  ])("reads the reason from %s", async (body, reason) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 400 })));
    const { lichessPlayMove } = await loadLichess();
    await expect(lichessPlayMove("lio_token", "game1", "e2e5")).rejects.toMatchObject({ status: 400, reason });
    vi.unstubAllGlobals();
  });

  it("explains a network failure", async () => {
    const { describeLichessError } = await loadLichess();
    expect(describeLichessError(new TypeError("Failed to fetch"))).toContain("could not be reached");
  });
});

describe("lichessImportGame", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("imports the PGN without a login and returns the game's page", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: "abc", url: "https://lichess.org/game/abc" }));
    vi.stubGlobal("fetch", fetchMock);

    const url = await (await loadLichess()).lichessImportGame("1. e4 e5 *");

    const [importUrl, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(importUrl).toBe("https://lichess.org/api/import");
    expect(new Headers(request.headers).has("Authorization")).toBe(false);
    expect((request.body as URLSearchParams).get("pgn")).toBe("1. e4 e5 *");
    expect(url).toBe("https://lichess.org/game/abc");
  });

  it("throws Lichess's refusal", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("slow down", { status: 429 })));

    await expect((await loadLichess()).lichessImportGame("*")).rejects.toMatchObject({ status: 429 });
  });
});
