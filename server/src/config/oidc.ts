import { createRemoteJWKSet } from 'jose';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const oidcConfig = {
  issuer: requireEnv('AUTH_ISSUER'),
  clientId: requireEnv('AUTH_CLIENT_ID'),
  // redirectUri must match the value registered with the auth server EXACTLY
  // (no trailing slash tolerance, no wildcards). Never derive/rebuild this.
  redirectUri: requireEnv('AUTH_REDIRECT_URI'),
  postLogoutRedirectUri: requireEnv('AUTH_POST_LOGOUT_REDIRECT_URI'),
  get authorizeUrl() {
    return `${this.issuer}/authorize`;
  },
  get tokenUrl() {
    return `${this.issuer}/token`;
  },
  get jwksUrl() {
    return `${this.issuer}/jwks`;
  },
  get endSessionUrl() {
    return `${this.issuer}/end_session`;
  },
};

let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

export function getJwks() {
  if (!_jwks) {
    _jwks = createRemoteJWKSet(new URL(oidcConfig.jwksUrl));
  }
  return _jwks;
}
