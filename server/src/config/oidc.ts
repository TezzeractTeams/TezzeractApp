// Load .env before the module-level requireEnv() calls below. ES imports are
// hoisted, so dotenv.config() in server.ts can run after this module loads.
import 'dotenv/config';
import { createRemoteJWKSet } from 'jose';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function resolvePostLogoutRedirectUri(issuer: string): string {
  const landing =
    process.env.AUTH_POST_LOGOUT_LANDING_URI ??
    process.env.AUTH_POST_LOGOUT_REDIRECT_URI;
  if (landing) return landing;
  // Same default as Drive: land on auth /signed-out so RP-initiated logout
  // finishes on Identity and does not bounce straight into app silent SSO.
  return `${issuer.replace(/\/$/, '')}/signed-out`;
}

const issuer = requireEnv('AUTH_ISSUER');

export const oidcConfig = {
  issuer,
  clientId: requireEnv('AUTH_CLIENT_ID'),
  // redirectUri must match the value registered with the auth server EXACTLY
  // (no trailing slash tolerance, no wildcards). Never derive/rebuild this.
  redirectUri: requireEnv('AUTH_REDIRECT_URI'),
  postLogoutRedirectUri: resolvePostLogoutRedirectUri(issuer),
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
