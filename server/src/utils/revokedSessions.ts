import { CLAIMS_CACHE_MS } from './oidc.js';

/**
 * Backchannel logout (`POST /auth/backchannel-logout`) is a server-to-server
 * call made directly by auth.tezzeract.com — its response never reaches the
 * user's browser, so clearing cookies there cannot sign out an already-open
 * tab. The access token in that tab's cookie jar is still cryptographically
 * valid for up to `CLAIMS_CACHE_MS` after logout.
 *
 * This in-memory store closes that window: the backchannel handler records
 * the session's `sid`, and `getMe` rejects any access token carrying a
 * revoked `sid`, even though its signature and `exp` still check out. A TTL
 * equal to the access-token lifetime is enough — nothing here needs to
 * outlive the token it is protecting against, and refresh tokens are
 * already revoked server-side at auth.tezzeract.com, so a later refresh
 * cannot resurrect the session either.
 *
 * In-memory and per-process is a deliberate, scoped choice: it only has to
 * survive one access-token lifetime (minutes), not the life of the
 * deployment. A multi-instance deployment would need this centralized (e.g.
 * Redis) to catch every instance consistently; tracked as a follow-up.
 */

const revokedSessionExpiry = new Map<string, number>();

function sweepExpired(now: number): void {
  for (const [sid, expiresAt] of revokedSessionExpiry) {
    if (expiresAt <= now) {
      revokedSessionExpiry.delete(sid);
    }
  }
}

/** Mark a session id as revoked for the remainder of an access token's life. */
export function revokeSession(sid: string, ttlMs: number = CLAIMS_CACHE_MS): void {
  const now = Date.now();
  sweepExpired(now);
  revokedSessionExpiry.set(sid, now + ttlMs);
}

/** True if this session id was revoked and the revocation has not expired. */
export function isSessionRevoked(sid: string | undefined): boolean {
  if (!sid) return false;
  const now = Date.now();
  const expiresAt = revokedSessionExpiry.get(sid);
  if (expiresAt === undefined) return false;
  if (expiresAt <= now) {
    revokedSessionExpiry.delete(sid);
    return false;
  }
  return true;
}
