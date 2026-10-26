import { userReset, userSetToken, userSetUsername } from '../slices/userSlice';
import type { Dispatch } from 'react';
import type { UnknownAction } from '@reduxjs/toolkit';
import type { NavigateFunction } from 'react-router-dom';
import type { Study } from '../types';
import type { components, operations } from '@lichess-org/types';

const lichessHost = 'https://lichess.org';
const scopes = ["study:write", "study:read", "board:play"];
const clientId = 'camera-chess-web';
const clientUrl = `${location.protocol}//${location.host}/`;

// Pending authorization request, kept in session storage across the redirect to Lichess.
const pkceStorageKey = 'lichess-oauth-pkce';
type PkceState = { verifier: string; state: string };

const base64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const randomString = () => base64Url(crypto.getRandomValues(new Uint8Array(32)));

const codeChallenge = async (verifier: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

const takePkceState = (): PkceState | null => {
  const stored = sessionStorage.getItem(pkceStorageKey);
  sessionStorage.removeItem(pkceStorageKey);
  return stored === null ? null : JSON.parse(stored) as PkceState;
}

// Lichess OAuth tokens are long-lived and cannot be refreshed, so a code is only exchanged once at login.
const exchangeCode = async (code: string, verifier: string): Promise<string> => {
  const response = await fetch(`${lichessHost}/api/token`, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      redirect_uri: clientUrl,
      client_id: clientId,
    }),
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`${response.status} ${response.statusText}${details ? `: ${details}` : ''}`);
  }
  const { access_token } = await response.json() as TokenResult;
  return access_token;
}

const readStream = <T,>(processLine: (line: T) => void | Promise<void>) => async (response: Response) => {
  if (response.body === null) {
    throw new Error('Lichess returned an empty stream.');
  }

  const stream = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const processBuffer = async (flush: boolean) => {
    const lines = buffer.split(/\r?\n/);
    buffer = flush ? '' : lines.pop() ?? '';
    for (const line of lines) {
      if (line.trim() !== '') {
        await processLine(JSON.parse(line) as T);
      }
    }
  };

  try {
    while (true) {
      const { done, value } = await stream.read();
      if (done) {
        buffer += decoder.decode();
        await processBuffer(true);
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      await processBuffer(false);
    }
  } finally {
    stream.releaseLock();
  }
}

const fetchBody = async <T,>(token: string, path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetchResponse(token, path, options);
  return response.json() as Promise<T>;
}

const fetchResponse = async (token: string, path: string, options: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  const config: RequestInit = {
    ...options,
    headers,
  }
  const response = await fetch(`${lichessHost}${path}`, config);
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`${response.status} ${response.statusText}${details ? `: ${details}` : ''}`);
  }
  return response;
};

type Schemas = components["schemas"];
type JsonResponse<Op extends keyof operations> =
  operations[Op] extends { responses: { 200: { content: { "application/json": infer T } } } } ? T : never;

type TokenResult = JsonResponse<"apiToken">;
type Account = JsonResponse<"accountMe">;
type Playing = JsonResponse<"apiAccountPlaying">;
export type NowPlayingGame = Playing["nowPlaying"][number];
export type BoardStreamEvent =
  | Schemas["GameFullEvent"]
  | Schemas["GameStateEvent"]
  | Schemas["ChatLineEvent"]
  | Schemas["OpponentGoneEvent"];

const setBroadcastlessStudies = async (token: string, username: string, setStudies: (studies: Study[]) => void, broadcasts: Study[]) => {
  const path = `/api/study/by/${username}`;
  const broadcastIds = new Set(broadcasts.map(({ id }) => id));

  const studies: Study[] = [];
  const response = await fetchResponse(token, path, { headers: { Accept: 'application/x-ndjson' } });
  await readStream<Schemas["StudyMetadata"]>((study) => {
    if (!broadcastIds.has(study.id)) {
      studies.push(study);
    }
  })(response);
  setStudies(studies);
}

export const lichessLogin = async () => {
  const pkce: PkceState = { verifier: randomString(), state: randomString() };
  sessionStorage.setItem(pkceStorageKey, JSON.stringify(pkce));

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: clientUrl,
    code_challenge_method: 'S256',
    code_challenge: await codeChallenge(pkce.verifier),
    scope: scopes.join(' '),
    state: pkce.state,
  });
  location.assign(`${lichessHost}/oauth?${params}`);
}

export const lichessLogout = async (dispatch: Dispatch<UnknownAction>, token: string) => {
  try {
    await fetchResponse(token, '/api/token', { method: 'DELETE' });
  } catch (error) {
    console.warn('Unable to revoke Lichess token.', error);
  }
  sessionStorage.removeItem(pkceStorageKey);
  dispatch(userReset());
}

const lichessGetAccount = (token: string): Promise<Account> => {
  const path = "/api/account";
  return fetchBody<Account>(token, path);
}

export const lichessSetStudies = async (token: string, setStudies: (studies: Study[]) => void, username: string, onlyBroadcasts: boolean) => {
  const path = `/api/broadcast/my-rounds`;
  const broadcasts: Study[] = [];
  const response = await fetchResponse(token, path, { headers: { Accept: 'application/x-ndjson' } });
  await readStream<Schemas["BroadcastMyRound"]>((broadcast) => {
    // my-rounds also lists rounds we're only a viewing member of; we can't push to those.
    if (broadcast.study.writeable) {
      broadcasts.push(broadcast.round);
    }
  })(response);
  if (onlyBroadcasts) {
    setStudies(broadcasts);
    return;
  }
  await setBroadcastlessStudies(token, username, setStudies, broadcasts);
}

export const lichessImportPgnToStudy = (token: string, pgn: string, name: string, studyId: string) => {
  const path = `/api/study/${studyId}/import-pgn`;
  const options = {
    body: new URLSearchParams({ pgn: pgn, name: name }),
    method: "POST",
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  };
  return fetchResponse(token, path, options);
}

export const lichessPushRound = async (token: string, pgn: string, roundId: string): Promise<Schemas["BroadcastPgnPush"]> => {
  const path = `/api/broadcast/round/${roundId}/push`;
  const options = {
    body: pgn,
    method: "POST",
    headers: { 'Content-Type': 'text/plain' }
  }
  const result = await fetchBody<Schemas["BroadcastPgnPush"]>(token, path, options);
  const errors = result.games.flatMap(({ error }) => error === undefined ? [] : [error]);
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
  return result;
}

export const lichessStreamGame = (token: string, callback: (event: BoardStreamEvent) => void | Promise<void>, gameId: string) => {
  const path = `/api/board/game/stream/${gameId}`;
  const controller = new AbortController();
  void fetchResponse(token, path, {
    signal: controller.signal,
    headers: { Accept: 'application/x-ndjson' }
  })
    .then(readStream(callback))
    .catch((error: unknown) => {
      if (!controller.signal.aborted) {
        console.error('Lichess game stream failed.', error);
      }
    });
  return controller;
}

export const lichessGetPlaying = (token: string): Promise<Playing> => {
  const path = "/api/account/playing";
  return fetchBody<Playing>(token, path);
}

export const lichessPlayMove = (token: string, gameId: string, move: string) => {
  const path = `/api/board/game/${gameId}/move/${move}`;
  const options = {
    method: "POST"
  }
  return fetchResponse(token, path, options);
}

export const lichessTrySetUser = async (navigate: NavigateFunction, dispatch: Dispatch<UnknownAction>) => {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  const error = params.get('error');
  if (code === null && error === null) {
    return;
  }

  // Taking the stored state also stops a second effect run from exchanging the same code twice.
  const pkce = takePkceState();
  if (pkce === null) {
    return;
  }

  if (error !== null || code === null || params.get('state') !== pkce.state) {
    console.warn('Lichess authorization failed.', error ?? 'state mismatch', params.get('error_description') ?? '');
    void navigate("/");
    return;
  }

  const newToken = await exchangeCode(code, pkce.verifier);
  dispatch(userSetToken(newToken));

  const account = await lichessGetAccount(newToken);
  const username: string = account.username;
  dispatch(userSetUsername(username))

  void navigate("/");
}
