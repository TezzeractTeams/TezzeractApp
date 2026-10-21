import cookieParser from 'cookie-parser';
import express from 'express';
import type { AddressInfo } from 'net';
import type { Server } from 'http';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { sanitizeNextPath } from '../src/utils/safeNext.js';

process.env.AUTH_ISSUER = 'https://auth.example.test';
process.env.AUTH_CLIENT_ID = 'app';
process.env.AUTH_REDIRECT_URI = 'https://app.example.test/auth/callback';
process.env.CLIENT_URL = 'https://app.example.test';

vi.mock('../src/utils/oidc.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/utils/oidc.js')>()),
  verifyAccessToken: vi.fn(async () => ({ sub: 'u1', sid: 's1' })),
}));

const { default: oidcRoutes } = await import('../src/routes/oidc.routes.js');

let server: Server;
let base: string;
const realFetch = globalThis.fetch;
const tokenRequests: URLSearchParams[] = [];

beforeAll(async () => {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use('/auth', oidcRoutes);
  server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith('https://auth.example.test/token')) {
      tokenRequests.push(new URLSearchParams(String(init?.body)));
      return Response.json({ access_token: 'a', refresh_token: 'r', id_token: 'i' });
    }
    return realFetch(input, init);
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
  server.close();
});

const setCookies = (res: Response) => res.headers.getSetCookie();

function cookieJar(setCookieHeaders: string[]): Record<string, string> {
  const jar: Record<string, string> = {};
  for (const header of setCookieHeaders) {
    const [pair] = header.split(';');
    const index = pair.indexOf('=');
    jar[pair.slice(0, index)] = pair.slice(index + 1);
  }
  return jar;
}

const toHeader = (jar: Record<string, string>) =>
  Object.entries(jar)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');

async function startLogin(next = '/talent') {
  const res = await realFetch(`${base}/auth/login?next=${encodeURIComponent(next)}`, {
    redirect: 'manual',
  });
  const location = new URL(res.headers.get('location') as string);
  return {
    state: location.searchParams.get('state') as string,
    jar: cookieJar(setCookies(res)),
  };
}

describe('PKCE cookies are per login attempt', () => {
  it('suffixes the cookies with the state so two tabs do not collide', async () => {
    const a = await startLogin('/a');
    const b = await startLogin('/b');

    expect(a.state).not.toBe(b.state);
    expect(Object.keys(a.jar)).toContain(`pkce_verifier_${a.state}`);
    expect(Object.keys(b.jar)).toContain(`pkce_verifier_${b.state}`);
    expect(Object.keys(a.jar)).not.toContain('pkce_verifier');
    expect(Object.keys(a.jar)).not.toContain('oauth_state');
  });

  it('completes both interleaved logins with the right verifier and deletes only its own cookies', async () => {
    const a = await startLogin('/a');
    const b = await startLogin('/b');
    const browserJar = { ...a.jar, ...b.jar };
    tokenRequests.length = 0;

    const callbackA = await realFetch(`${base}/auth/callback?code=code-a&state=${a.state}`, {
      redirect: 'manual',
      headers: { cookie: toHeader(browserJar) },
    });
    expect(callbackA.status).toBe(302);
    expect(callbackA.headers.get('location')).toBe('https://app.example.test/a');
    expect(tokenRequests[0].get('code_verifier')).toBe(a.jar[`pkce_verifier_${a.state}`]);

    const cleared = setCookies(callbackA).filter((h) => /Expires=Thu, 01 Jan 1970/.test(h));
    expect(cleared.some((h) => h.startsWith(`pkce_verifier_${a.state}=`))).toBe(true);
    expect(cleared.some((h) => h.startsWith(`pkce_verifier_${b.state}=`))).toBe(false);

    const callbackB = await realFetch(`${base}/auth/callback?code=code-b&state=${b.state}`, {
      redirect: 'manual',
      headers: { cookie: toHeader(browserJar) },
    });
    expect(callbackB.headers.get('location')).toBe('https://app.example.test/b');
    expect(tokenRequests[1].get('code_verifier')).toBe(b.jar[`pkce_verifier_${b.state}`]);
  });

  it('rejects a state that this browser never started', async () => {
    const res = await realFetch(
      `${base}/auth/callback?code=x&state=${'z'.repeat(22)}`,
      { redirect: 'manual' },
    );
    expect(res.status).toBe(400);
  });
});

describe('sanitizeNextPath', () => {
  it.each([
    ['//evil.com', '/'],
    ['https://evil.com', '/'],
    ['/ok?x=http://a', '/'],
    ['/safe/path?x=1', '/safe/path?x=1'],
    ['', '/'],
    [undefined, '/'],
  ])('maps %s to %s', (input, expected) => {
    expect(sanitizeNextPath(input)).toBe(expected);
  });
});
