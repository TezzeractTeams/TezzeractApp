import { createHash } from 'crypto';
import type { JWTPayload } from 'jose';
import { refreshAccessToken, verifyAccessToken, type TokenSet } from './oidc.js';
import { isRedisConfigured, redisCommand } from './redisRest.js';
import { isSessionRevoked } from './revokedSessions.js';

/**
 * Refresh-token exchange with two guarantees:
 *
 *  1. A revoked session is never revived. The new access token's `sid` is
 *     checked and, if revoked, no tokens are returned.
 *  2. A refresh token is spent only once. Refresh tokens rotate and reusing
 *     one revokes the whole grant, so parallel requests must not both send
 *     it. Within one process the in-flight promise is shared; across
 *     instances a short Redis lock elects one winner and the others read the
 *     winner's token-free claims.
 */

export type RefreshOutcome =
  | { kind: 'ok'; claims: JWTPayload; tokens: TokenSet }
  | { kind: 'shared'; claims: JWTPayload }
  | { kind: 'revoked' }
  | { kind: 'failed' };

const LOCK_TTL_SECONDS = 10;
const RESULT_TTL_SECONDS = 15;
const WAIT_STEP_MS = 150;
const WAIT_MAX_MS = 3000;

const inFlight = new Map<string, Promise<RefreshOutcome>>();

const fingerprint = (token: string) =>
  createHash('sha256').update(token).digest('hex').slice(0, 32);

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function refreshAndCheck(refreshToken: string): Promise<RefreshOutcome> {
  let tokens: TokenSet;
  try {
    tokens = await refreshAccessToken(refreshToken);
  } catch {
    return { kind: 'failed' };
  }

  try {
    const claims = await verifyAccessToken(tokens.access_token);
    if (typeof claims.sid === 'string' && (await isSessionRevoked(claims.sid))) {
      return { kind: 'revoked' };
    }
    return { kind: 'ok', claims, tokens };
  } catch {
    return { kind: 'failed' };
  }
}

async function crossInstanceRefresh(refreshToken: string, id: string): Promise<RefreshOutcome> {
  if (!isRedisConfigured()) return refreshAndCheck(refreshToken);

  const lockKey = `lock:refresh:${id}`;
  const resultKey = `refreshed:${id}`;

  let acquired = false;
  try {
    acquired =
      (await redisCommand(['SET', lockKey, '1', 'NX', 'EX', LOCK_TTL_SECONDS])) === 'OK';
  } catch {
    return refreshAndCheck(refreshToken);
  }

  if (acquired) {
    const outcome = await refreshAndCheck(refreshToken);
    try {
      if (outcome.kind === 'ok') {
        // Claims only, never a token.
        await redisCommand([
          'SET',
          resultKey,
          JSON.stringify(outcome.claims),
          'EX',
          RESULT_TTL_SECONDS,
        ]);
      }
      await redisCommand(['DEL', lockKey]);
    } catch {
      // The lock expires on its own.
    }
    return outcome;
  }

  for (let waited = 0; waited < WAIT_MAX_MS; waited += WAIT_STEP_MS) {
    await sleep(WAIT_STEP_MS);
    try {
      const shared = await redisCommand(['GET', resultKey]);
      if (typeof shared === 'string') {
        return { kind: 'shared', claims: JSON.parse(shared) as JWTPayload };
      }
    } catch {
      break;
    }
  }
  return { kind: 'failed' };
}

export function refreshSession(refreshToken: string): Promise<RefreshOutcome> {
  const id = fingerprint(refreshToken);
  const existing = inFlight.get(id);
  if (existing) return existing;

  const flight = crossInstanceRefresh(refreshToken, id).finally(() => {
    inFlight.delete(id);
  });
  inFlight.set(id, flight);
  return flight;
}
