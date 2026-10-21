import { isRedisConfigured, redisCommand } from './redisRest.js';

/**
 * Backchannel logout (`POST /auth/backchannel-logout`) is a server-to-server
 * call made directly by auth.tezzeract.com, so its response never reaches the
 * user's browser and cannot clear any cookie. The access token in an open
 * tab stays cryptographically valid until it expires.
 *
 * The backchannel handler records the session's `sid` here and every session
 * check rejects tokens carrying a revoked `sid`. The store is Upstash Redis
 * over HTTP so every API instance sees the same revocations. The TTL is the
 * refresh token lifetime: a revoked session must stay revoked for as long as
 * a refresh token for it could still exist.
 *
 * Failure policy: recording a revocation throws, so the backchannel endpoint
 * answers 500 and the auth server can retry. Reading fails open (the token
 * is still verified by signature and expiry) and logs a warning without the
 * `sid`.
 */

/** Refresh token lifetime at auth.tezzeract.com (14 days). */
export const REVOCATION_TTL_SECONDS = 14 * 24 * 60 * 60;

const keyFor = (sid: string) => `revoked:${sid}`;

let warnedUnconfigured = false;

export async function revokeSession(
  sid: string,
  ttlSeconds: number = REVOCATION_TTL_SECONDS,
): Promise<void> {
  await redisCommand(['SET', keyFor(sid), '1', 'EX', ttlSeconds]);
}

export async function isSessionRevoked(sid: string | undefined): Promise<boolean> {
  if (!sid) return false;

  if (!isRedisConfigured()) {
    if (!warnedUnconfigured) {
      warnedUnconfigured = true;
      console.warn('Session revocation store is not configured; revoked sessions are not enforced.');
    }
    return false;
  }

  try {
    const result = await redisCommand(['EXISTS', keyFor(sid)]);
    return result === 1;
  } catch {
    console.warn('Session revocation lookup failed; treating the session as not revoked.');
    return false;
  }
}
