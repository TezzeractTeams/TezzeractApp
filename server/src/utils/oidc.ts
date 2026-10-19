import crypto from 'crypto';
import { jwtVerify, type JWTPayload } from 'jose';
import { oidcConfig, getJwks } from '../config/oidc.js';

function base64url(input: Buffer): string {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function generateCodeVerifier(): string {
  return base64url(crypto.randomBytes(32));
}

export function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64url(hash);
}

export function generateState(): string {
  return base64url(crypto.randomBytes(16));
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: oidcConfig.issuer,
    audience: oidcConfig.clientId,
  });
  return payload;
}

export const TRANSIENT_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;

export function transientCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    maxAge: TRANSIENT_COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

export function tokenCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
  };
}

// Claims such as `memberships`/`standing` on the verified token must be treated
// as a short-lived cache only — NOT as an authorization decision. Any
// consequential action must re-verify against the auth service rather than
// trusting a cached claim older than this window.
export const CLAIMS_CACHE_MS = 15 * 60 * 1000;
