import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Dispatch } from "react";
import type { UnknownAction } from "@reduxjs/toolkit";
import type { NavigateFunction } from "react-router-dom";
import { MemoryStorage } from "../test/helpers";

const origin = "https://chesscam.example";

const stubLocation = (search: string = "") => {
  const location = { protocol: "https:", host: "chesscam.example", search, assign: vi.fn() };
  vi.stubGlobal("location", location);
  return location;
}

const loadLichess = () => import("./lichess");

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
  let dispatch: Dispatch<UnknownAction>;
  let navigate: NavigateFunction;

  beforeEach(() => {
    vi.resetModules();
    storage = new MemoryStorage();
    vi.stubGlobal("sessionStorage", storage);
    dispatch = vi.fn();
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

    await (await loadLichess()).lichessTrySetUser(navigate, dispatch);

    const [tokenUrl, tokenRequest] = fetchMock.mock.calls[0];
    expect(tokenUrl).toBe("https://lichess.org/api/token");
    expect(Object.fromEntries(tokenRequest.body as URLSearchParams)).toEqual({
      grant_type: "authorization_code",
      code: "liu_code",
      code_verifier: verifier,
      redirect_uri: `${origin}/`,
      client_id: "camera-chess-web"
    });
    expect(dispatch).toHaveBeenCalledWith({ type: "user/userSetToken", payload: "lio_token" });
    expect(dispatch).toHaveBeenCalledWith({ type: "user/userSetUsername", payload: "magnus" });
    expect(navigate).toHaveBeenCalledWith("/");
    expect(storage.getItem("lichess-oauth-pkce")).toBeNull();
  });

  it("rejects a mismatched state without requesting a token", async () => {
    await startLogin();
    vi.resetModules();
    stubLocation("?code=liu_code&state=forged");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await (await loadLichess()).lichessTrySetUser(navigate, dispatch);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
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

    await lichessTrySetUser(navigate, dispatch);
    await lichessTrySetUser(navigate, dispatch);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does nothing on a normal page load", async () => {
    stubLocation();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await (await loadLichess()).lichessTrySetUser(navigate, dispatch);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
