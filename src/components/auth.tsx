import { HttpClient, OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce';

export const lichessHost = 'https://lichess.org';
export const scopes = ["study:write", "study:read"];
export const clientId = 'lichess-api-demo';
export const clientUrl = `${location.protocol}//${location.host}/`;

export class Auth {
  oauth: OAuth2AuthCodePKCE = new OAuth2AuthCodePKCE({
    authorizationUrl: `${lichessHost}/oauth`,
    tokenUrl: `${lichessHost}/api/token`,
    clientId,
    scopes,
    redirectUrl: clientUrl,
    onAccessTokenExpiry: refreshAccessToken => refreshAccessToken(),
    onInvalidGrant: console.warn,
  });
  me: any = undefined;

  async init() {
    try {
      const accessContext = await this.oauth.getAccessToken();
      if (accessContext) await this.authenticate();
    } catch (err) {
      console.error(err);
    }
    if (!this.me) {
      try {
        const hasAuthCode: boolean = await this.oauth.isReturningFromAuthServer();
        if (hasAuthCode) await this.authenticate();
      } catch (err) {
        console.error(err);
      }
    }
  }

  async login() {
    await this.oauth.fetchAuthorizationCode();
  }

  async logout() {
    if (this.me) await this.me.httpClient(`${lichessHost}/api/token`, { method: 'DELETE' });
    localStorage.clear();
    this.me = undefined;
  }

  private authenticate = async () => {
    const httpClient: HttpClient = this.oauth.decorateFetchHTTPClient(window.fetch);
    const res: any = await httpClient(`${lichessHost}/api/account`);
    const me: any = {
      ...(await res.json()),
      httpClient,
    };
    if (me.error) throw me.error;
    this.me = me;
  };

  fetchBody = async (path: string, config: any = {}) => {
    const res: any = await this.fetchResponse(path, config);
    const body: any = await res.json();
    return body;
  };

  private fetchResponse = async (path: string, config: any = {}) => {
    const res: any = await (this.me?.httpClient || window.fetch)(`${lichessHost}${path}`, config);
    if (!res.ok) {
      const err = `${res.status} ${res.statusText}`;
      alert(err);
      throw err;
    }
    return res;
  };
}

export default Auth;