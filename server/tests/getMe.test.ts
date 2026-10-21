import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifyAccessToken = vi.fn();
const refreshAccessToken = vi.fn();
const revoked = new Set<string>();

vi.mock('../src/utils/oidc.js', () => ({
  verifyAccessToken: (...args: unknown[]) => verifyAccessToken(...args),
  refreshAccessToken: (...args: unknown[]) => refreshAccessToken(...args),
  tokenCookieOptions: () => ({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' }),
}));

vi.mock('../src/utils/revokedSessions.js', () => ({
  isSessionRevoked: async (sid?: string) => (sid ? revoked.has(sid) : false),
}));

const { getMe } = await import('../src/controllers/me.controller.js');

function fakeRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    cookies: {} as Record<string, string>,
    cleared: [] as string[],
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
    cookie(name: string, value: string) {
      this.cookies[name] = value;
      return this;
    },
    clearCookie(name: string) {
      this.cleared.push(name);
      return this;
    },
  };
  return res;
}

const call = (cookies: Record<string, string>) => {
  const res = fakeRes();
  return getMe({ cookies } as unknown as Request, res as unknown as Response).then(() => res);
};

beforeEach(() => {
  verifyAccessToken.mockReset();
  refreshAccessToken.mockReset();
  revoked.clear();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

describe('GET /api/me', () => {
  it('returns claims for a valid access token', async () => {
    verifyAccessToken.mockResolvedValue({ sub: 'u1', sid: 's1' });
    const res = await call({ access_token: 'a' });
    expect(res.statusCode).toBe(200);
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it('refreshes with the refresh token when the access token is expired', async () => {
    verifyAccessToken
      .mockRejectedValueOnce(new Error('expired'))
      .mockResolvedValueOnce({ sub: 'u1', sid: 's2' });
    refreshAccessToken.mockResolvedValue({
      access_token: 'new-a',
      refresh_token: 'new-r',
      id_token: 'new-i',
    });

    const res = await call({ access_token: 'old', refresh_token: 'r-expired-case' });
    expect(res.statusCode).toBe(200);
    expect(res.cookies['access_token']).toBe('new-a');
    expect(res.cookies['refresh_token']).toBe('new-r');
  });

  it('refreshes when the access token cookie is missing', async () => {
    verifyAccessToken.mockResolvedValue({ sub: 'u1', sid: 's3' });
    refreshAccessToken.mockResolvedValue({ access_token: 'new-a' });
    const res = await call({ refresh_token: 'r-missing-case' });
    expect(res.statusCode).toBe(200);
  });

  it('answers 401 and clears cookies when the refreshed session is revoked', async () => {
    revoked.add('s-revoked');
    verifyAccessToken.mockResolvedValue({ sub: 'u1', sid: 's-revoked' });
    refreshAccessToken.mockResolvedValue({ access_token: 'new-a' });

    const res = await call({ refresh_token: 'r-revoked-case' });
    expect(res.statusCode).toBe(401);
    expect(res.cookies['access_token']).toBeUndefined();
    expect(res.cleared).toEqual(expect.arrayContaining(['access_token', 'refresh_token', 'id_token']));
  });

  it('spends a refresh token once for parallel requests', async () => {
    let release!: () => void;
    refreshAccessToken.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ access_token: 'new-a' });
        }),
    );
    verifyAccessToken.mockResolvedValue({ sub: 'u1', sid: 's4' });

    const first = call({ refresh_token: 'r-parallel' });
    const second = call({ refresh_token: 'r-parallel' });
    await vi.waitFor(() => expect(refreshAccessToken).toHaveBeenCalled());
    release();

    const [a, b] = await Promise.all([first, second]);
    expect(a.statusCode).toBe(200);
    expect(b.statusCode).toBe(200);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
  });

  it('answers 401 with no cookies at all', async () => {
    const res = await call({});
    expect(res.statusCode).toBe(401);
  });
});
