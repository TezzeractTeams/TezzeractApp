// OIDC configuration for the central auth service (auth.tezzeract.dev).
// This is a separate, additive auth mechanism from the existing Supabase auth.
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

// Create a single remote JWKS instance and reuse it across requests
// (per `jose` guidance — avoid recreating this per-request).
let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

export function getJwks() {
  if (!_jwks) {
    _jwks = createRemoteJWKSet(new URL(oidcConfig.jwksUrl));
  }
  return _jwks;
}
