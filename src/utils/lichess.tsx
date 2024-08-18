import { AccessContext, OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce';
import { userReset, userSetToken, userSetUsername } from '../slices/userSlice';
import { Dispatch } from 'react';
import { AnyAction } from 'redux';
import { NavigateFunction } from 'react-router-dom';
import { Study } from '../types';

const lichessHost = 'https://lichess.org';
const scopes = ["study:write", "study:read", "challenge:read", "bot:play", "board:play"];
const clientId = 'lichess-api-demo';
const clientUrl = `${location.protocol}//${location.host}/`;

const getOauth = () => {
  const oauth: OAuth2AuthCodePKCE = new OAuth2AuthCodePKCE({
    authorizationUrl: `${lichessHost}/oauth`,
    tokenUrl: `${lichessHost}/api/token`,
    clientId,
    scopes,
    redirectUrl: clientUrl,
    onAccessTokenExpiry: refreshAccessToken => refreshAccessToken(),
    onInvalidGrant: console.warn,
  });
  return oauth
}

const readStream = (processLine: any) => (response: any) => {
  const stream = response.body.getReader();
  const matcher = /\r?\n/;
  const decoder = new TextDecoder();
  let buf: any = '';

  const loop = () =>
    stream.read().then(({ done, value }: {done: boolean, value: any}) => {
      if (done) {
        if (buf.length > 0) processLine(JSON.parse(buf));
      } else {
        const chunk = decoder.decode(value, {
          stream: true
        });
        buf += chunk;

        const parts = buf.split(matcher);
        buf = parts.pop();
        for (const i of parts.filter((p: any) => p)) processLine(JSON.parse(i));
        return loop();
      }
    });

  return loop();
}

const fetchBody = async (token: string, path: string, options: any = {}) => {
  const res: any = await fetchResponse(token, path, options);
  const body: any = await res.json();
  return body;
}

const fetchResponse = async (token: string, path: string, options: any = {}) => {
  const config: any = {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
  const res: any = await window.fetch(`${lichessHost}${path}`, config);
  if (!res.ok) {
    const err = `${res.status} ${res.statusText}`;
    alert(err);
    throw err;
  }
  return res;
};

const setBroadcastlessStudies = async (token: string, username: string, setStudies: any, broadcasts: any) => {
  const path = `/api/study/by/${username}`;

  const broadcastIds = broadcasts.map((x: any) => x.id);

  const studies: Study[] = [];
  fetchResponse(token, path)
  .then(readStream(async (response: any) => {
    const id_ = response.id;
    if (!(broadcastIds.includes(id_))) {
      studies.push({
        "id": id_, 
        "name": response.name
      });
    }
  }))
  .then(() => setStudies(studies));
}

export const lichessLogin = () => {
  const oauth = getOauth();
  oauth.fetchAuthorizationCode();
}

export const lichessLogout = (dispatch: Dispatch<AnyAction>) => {
  localStorage.removeItem("oauth2authcodepkce-state");
  dispatch(userReset());
}

export const lichessGetAccount = (token: string) => {
  const path = "/api/account";
  const account = fetchBody(token, path);
  return account;
}

export const lichessSetStudies = (token: string, setStudies: any, username: string, onlyBroadcasts: boolean) => {
  const path = `/api/broadcast/my-rounds`;
  const broadcasts: Study[] = [];
  fetchResponse(token, path)
  .then(readStream(async (response: any) => {
    broadcasts.push({
      "id": response.round.id, 
      "name": response.round.name
    });
  }))
  .then(() => {
    if (onlyBroadcasts) {
      setStudies(broadcasts);
    } else {
      setBroadcastlessStudies(token, username, setStudies, broadcasts);
    }
  });
}

export const lichessImportPgn = (token: string, pgn: string) => {
  const path = "/api/import";
  const options = {
    body: new URLSearchParams({ pgn }), 
    method: "POST"
  };
  const data = fetchBody(token, path, options);
  return data
}

export const lichessImportPgnToStudy = (token: string, pgn: string, name: string, studyId: string) => {
  const path = `/api/study/${studyId}/import-pgn`;
  const options = {
    body: new URLSearchParams({ pgn: pgn, name: name }), 
    method: "POST"
  };
  fetchResponse(token, path, options);
}

export const lichessPushRound = (token: string, pgn: string, roundId: string) => {
  const path = `/api/broadcast/round/${roundId}/push`;
  const options = {
    body: pgn,
    method: "POST"
  }
  fetchResponse(token, path, options);
}

export const lichessStreamGame = (token: string, callback: any, gameId: string) => {
  const path = `/api/board/game/stream/${gameId}`;
  fetchResponse(token, path)
  .then(readStream(callback));
}

export const lichessGetPlaying = (token: string) => {
  const path = "/api/account/playing";
  const playing = fetchBody(token, path);
  return playing;
}

export const lichessPlayMove = (token: string, gameId: string, move: string) => {
  const path = `/api/board/game/${gameId}/move/${move}`;
  const options = {
    method: "POST"
  }
  fetchResponse(token, path, options);
}

export const lichessTrySetUser = async (navigate: NavigateFunction, dispatch: Dispatch<AnyAction>) => {
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
  
  navigate("/");
}
