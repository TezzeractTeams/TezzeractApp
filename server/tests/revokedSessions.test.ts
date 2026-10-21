import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isSessionRevoked, revokeSession, REVOCATION_TTL_SECONDS } from '../src/utils/revokedSessions.js';

const store = new Map<string, string>();
const calls: unknown[][] = [];

beforeEach(() => {
  store.clear();
  calls.length = 0;
  process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.test';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: { body: string }) => {
      const command = JSON.parse(init.body) as (string | number)[];
      calls.push(command);
      const [name, key, value] = command as [string, string, string];
      if (name === 'SET') {
        store.set(key, value);
        return Response.json({ result: 'OK' });
      }
      if (name === 'EXISTS') {
        return Response.json({ result: store.has(key) ? 1 : 0 });
      }
      return Response.json({ error: 'unknown' }, { status: 400 });
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe('revokedSessions (Upstash REST)', () => {
  it('revokes a sid and then reports it revoked', async () => {
    await revokeSession('sid-1');
    expect(await isSessionRevoked('sid-1')).toBe(true);
  });

  it('stores under revoked:<sid> with the refresh-token TTL', async () => {
    await revokeSession('sid-2');
    expect(calls[0]).toEqual(['SET', 'revoked:sid-2', '1', 'EX', REVOCATION_TTL_SECONDS]);
    expect(REVOCATION_TTL_SECONDS).toBe(14 * 24 * 60 * 60);
  });

  it('reports an unknown or missing sid as not revoked', async () => {
    expect(await isSessionRevoked('never-revoked')).toBe(false);
    expect(await isSessionRevoked(undefined)).toBe(false);
  });

  it('fails open on read errors but throws on write errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('x', { status: 503 })));
    expect(await isSessionRevoked('sid-3')).toBe(false);
    await expect(revokeSession('sid-3')).rejects.toThrow();
  });
});
