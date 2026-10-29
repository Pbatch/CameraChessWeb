import { userReset, userSet } from '../slices/userSlice';
import type { NavigateFunction } from 'react-router';
import type { Study } from '../types';
import type { components, operations } from '@lichess-org/types';

const lichessHost = 'https://lichess.org';
const STREAM_RETRY_DELAY = 5000;
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

// A failed request, keeping its HTTP status and Lichess's reason so callers can tell what went wrong
export class LichessError extends Error {
  readonly status: number;
  readonly reason: string;

  constructor(status: number, message: string, reason: string = "") {
    super(message);
    this.status = status;
    this.reason = reason;
  }
}

// Lichess explains most refusals as {"error": "..."}
const parseReason = (details: string): string => {
  try {
    const { error } = JSON.parse(details) as { error?: unknown };
    if (typeof error === 'string') return error;
  } catch {
    // Not JSON, so the text is the reason
  }
  return details.trim();
}

const lichessError = async (response: Response): Promise<LichessError> => {
  const details = await response.text();
  const message = `${response.status} ${response.statusText}${details ? `: ${details}` : ''}`;
  return new LichessError(response.status, message, parseReason(details));
}

// Why a Lichess request failed, as a sentence for the user
export const describeLichessError = (error: unknown): string => {
  if (error instanceof LichessError) {
    if (error.status === 401) return "Your Lichess login has expired. Please log in again.";
    if (error.status === 403) return "Lichess did not allow this. Logging in again may help.";
    if (error.status === 404) return "Lichess could not find it.";
    if (error.status === 429) return "Lichess is limiting requests. Try again in a minute.";
    if (error.status >= 500) return "Lichess is having problems. Try again shortly.";
    return error.reason ? `Lichess refused the request: ${error.reason}` : `Lichess refused the request (${error.status}).`;
  }
  // fetch rejects with a TypeError when the network fails
  if (error instanceof TypeError) return "Lichess could not be reached. Check your connection.";
  return (error instanceof Error) ? error.message : String(error);
}

// Worth retrying, rather than a request Lichess will keep refusing
export const isTransientError = (error: unknown): boolean =>
  !(error instanceof LichessError) || error.status === 429 || error.status >= 500;

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
    throw await lichessError(response);
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
    throw await lichessError(response);
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

export const lichessLogout = async (token: string) => {
  try {
    await fetchResponse(token, '/api/token', { method: 'DELETE' });
  } catch (error) {
    console.warn('Unable to revoke Lichess token.', error);
  }
  sessionStorage.removeItem(pkceStorageKey);
  userReset();
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

export interface GameStreamHandlers {
  onEvent: (event: BoardStreamEvent) => void | Promise<void>,
  // The stream opened, at first or after a reconnect
  onConnect: () => void,
  // The connection failed, and another attempt follows if reconnecting
  onDisconnect: (error: unknown, reconnecting: boolean) => void,
  // An event could not be handled. The stream carries on, as a reconnect would only resend it.
  onEventError: (error: unknown) => void
}

// Reconnects after a transient failure; Lichess resends the whole game when a stream opens
export const lichessStreamGame = (token: string, gameId: string, handlers: GameStreamHandlers) => {
  const path = `/api/board/game/stream/${gameId}`;
  const controller = new AbortController();
  let retryTimeout: ReturnType<typeof setTimeout> | undefined;
  controller.signal.addEventListener('abort', () => clearTimeout(retryTimeout));

  const onEvent = async (event: BoardStreamEvent) => {
    try {
      await handlers.onEvent(event);
    } catch (error) {
      console.error('Unable to handle a Lichess game event.', event, error);
      handlers.onEventError(error);
    }
  };

  const connect = () => {
    void fetchResponse(token, path, {
      signal: controller.signal,
      headers: { Accept: 'application/x-ndjson' }
    })
      .then((response) => {
        handlers.onConnect();
        return readStream(onEvent)(response);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        console.error('Lichess game stream failed.', error);
        const reconnecting: boolean = isTransientError(error);
        handlers.onDisconnect(error, reconnecting);
        if (reconnecting) {
          retryTimeout = setTimeout(connect, STREAM_RETRY_DELAY);
        }
      });
  }
  connect();
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

export const lichessTrySetUser = async (navigate: NavigateFunction) => {
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

  try {
    if (error === 'access_denied') {
      console.warn('Lichess authorization was cancelled.');
      return;
    }
    if (error !== null || code === null || params.get('state') !== pkce.state) {
      throw new Error(`Lichess authorization failed: ${error ?? 'state mismatch'} ${params.get('error_description') ?? ''}`);
    }

    const newToken = await exchangeCode(code, pkce.verifier);
    // Both together, so a failed account lookup does not leave a token without a username
    const account = await lichessGetAccount(newToken);
    userSet({ token: newToken, username: account.username });
  } finally {
    void navigate("/");
  }
}
