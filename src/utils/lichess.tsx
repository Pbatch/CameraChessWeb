import { AccessContext, OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce';
import { userReset, userSetToken, userSetUsername } from '../slices/userSlice';
import { Dispatch } from 'react';
import { UnknownAction } from '@reduxjs/toolkit';
import { NavigateFunction } from 'react-router-dom';
import { Study } from '../types';

const lichessHost = 'https://lichess.org';
const scopes = ["study:write", "study:read", "board:play"];
const clientId = 'camera-chess-web';
const clientUrl = `${location.protocol}//${location.host}/`;

const getOauth = () => {
  const oauth: OAuth2AuthCodePKCE = new OAuth2AuthCodePKCE({
    authorizationUrl: `${lichessHost}/oauth`,
    tokenUrl: `${lichessHost}/api/token`,
    clientId,
    scopes,
    redirectUrl: clientUrl,
    // Lichess OAuth tokens are long-lived and cannot be refreshed.
    onAccessTokenExpiry: () => Promise.reject(new Error('Your Lichess session has expired. Please log in again.')),
    onInvalidGrant: console.warn,
  });
  return oauth
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

type Broadcast = { round: Study };
type Account = { username: string };
type Playing = { nowPlaying: unknown[] };
type ImportResult = { id: string; url: string };
type BroadcastPushResult = { games: { error?: string }[] };
type BoardStreamEvent = { type: string; moves?: string; state?: { moves?: string } };

const setBroadcastlessStudies = async (token: string, username: string, setStudies: (studies: Study[]) => void, broadcasts: Study[]) => {
  const path = `/api/study/by/${username}`;
  const broadcastIds = new Set(broadcasts.map(({ id }) => id));

  const studies: Study[] = [];
  const response = await fetchResponse(token, path, { headers: { Accept: 'application/x-ndjson' } });
  await readStream<Study>((study) => {
    if (!broadcastIds.has(study.id)) {
      studies.push(study);
    }
  })(response);
  setStudies(studies);
}

export const lichessLogin = () => {
  const oauth = getOauth();
  void oauth.fetchAuthorizationCode();
}

export const lichessLogout = async (dispatch: Dispatch<UnknownAction>, token: string) => {
  try {
    await fetchResponse(token, '/api/token', { method: 'DELETE' });
  } catch (error) {
    console.warn('Unable to revoke Lichess token.', error);
  }
  getOauth().reset();
  dispatch(userReset());
}

export const lichessGetAccount = (token: string): Promise<Account> => {
  const path = "/api/account";
  return fetchBody<Account>(token, path);
}

export const lichessSetStudies = async (token: string, setStudies: (studies: Study[]) => void, username: string, onlyBroadcasts: boolean) => {
  const path = `/api/broadcast/my-rounds`;
  const broadcasts: Study[] = [];
  const response = await fetchResponse(token, path, { headers: { Accept: 'application/x-ndjson' } });
  await readStream<Broadcast>((broadcast) => {
    broadcasts.push(broadcast.round);
  })(response);
  if (onlyBroadcasts) {
    setStudies(broadcasts);
    return;
  }
  await setBroadcastlessStudies(token, username, setStudies, broadcasts);
}

export const lichessImportPgn = (token: string, pgn: string): Promise<ImportResult> => {
  const path = "/api/import";
  const options = {
    body: new URLSearchParams({ pgn }),
    method: "POST",
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  };
  return fetchBody<ImportResult>(token, path, options);
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

export const lichessPushRound = async (token: string, pgn: string, roundId: string): Promise<BroadcastPushResult> => {
  const path = `/api/broadcast/round/${roundId}/push`;
  const options = {
    body: pgn,
    method: "POST",
    headers: { 'Content-Type': 'text/plain' }
  }
  const result = await fetchBody<BroadcastPushResult>(token, path, options);
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
  const oauth: OAuth2AuthCodePKCE = getOauth();
  const returning: boolean = await oauth.isReturningFromAuthServer();
  if (!returning) {
    return;
  }

  const accessContext: AccessContext = await oauth.getAccessToken();
  const newToken: string | undefined = accessContext?.token?.value;
  if (newToken === undefined) {
    console.log("Access Context token is undefined");
    return;
  }

  dispatch(userSetToken(newToken));

  const account: any = await lichessGetAccount(newToken);
  const username: string = account.username;
  dispatch(userSetUsername(username))

  void navigate("/");
}
