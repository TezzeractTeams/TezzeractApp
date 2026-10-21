import { Router } from 'express';
import { oidcConfig } from '../config/oidc.js';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  verifyAccessToken,
  transientCookieOptions,
  tokenCookieOptions,
} from '../utils/oidc.js';
import { verifyLogoutToken } from '../utils/backchannelLogout.js';
import { revokeSession } from '../utils/revokedSessions.js';

const router = Router();

function appendQueryParam(path: string, key: string, value: string): string {
  const qIndex = path.indexOf('?');
  const pathname = qIndex === -1 ? path : path.slice(0, qIndex);
  const search = qIndex === -1 ? '' : path.slice(qIndex + 1);
  const params = new URLSearchParams(search);
  params.set(key, value);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

function redirectToClient(res: import('express').Response, next: string, origin: string) {
  const target = origin ? `${origin}${next}` : next;
  return res.redirect(target);
}

/** Silent probe finished without tokens (logged out). */
function silentProbeDoneRedirect(
  res: import('express').Response,
  next: string,
  origin: string,
) {
  return redirectToClient(res, appendQueryParam(next, 'silent_sso', 'done'), origin);
}

/**
 * SSO session exists at auth.tezzeract.com but this client has no grant yet.
 * `prompt=none` cannot show consent; chain to interactive login, which
 * auto-continues when the user is already signed in (e.g. via Drive).
 */
function chainInteractiveLogin(res: import('express').Response, next: string) {
  return res.redirect(`/auth/login?next=${encodeURIComponent(next)}`);
}

function handleSilentAuthorizeError(
  res: import('express').Response,
  error: string,
  next: string,
  origin: string,
) {
  if (error === 'consent_required' || error === 'interaction_required') {
    return chainInteractiveLogin(res, next);
  }
  return silentProbeDoneRedirect(res, next, origin);
}

/**
 * Only ever a same-origin, root-relative path. Guards against the "next"
 * cookie being used to build an open redirect.
 */
function sanitizeNextPath(next: unknown): string {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) {
    return '/';
  }
  return next;
}

function clientOrigin(): string {
  return (process.env.CLIENT_URL || '').replace(/\/$/, '');
}

function clearTransientCookies(res: import('express').Response) {
  res.clearCookie('pkce_verifier', { path: '/' });
  res.clearCookie('oauth_state', { path: '/' });
  res.clearCookie('auth_next', { path: '/' });
  res.clearCookie('auth_silent', { path: '/' });
}

function clearTokenCookies(res: import('express').Response) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
  res.clearCookie('id_token', { path: '/' });
}

/**
 * GET /auth/login
 *
 * `?silent=1` is the silent-SSO probe used by the client on first load: it
 * asks the auth server with `prompt=none`, which resolves immediately
 * (success or `login_required`/`consent_required`/`interaction_required`
 * error) without ever rendering an interactive screen. `?next=` is preserved
 * across the round trip so the user lands back where they started.
 */
router.get('/login', (req, res) => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();
  const silent = req.query.silent === '1';
  const next = sanitizeNextPath(req.query.next);

  res.cookie('pkce_verifier', codeVerifier, transientCookieOptions());
  res.cookie('oauth_state', state, transientCookieOptions());
  res.cookie('auth_next', next, transientCookieOptions());
  if (silent) {
    res.cookie('auth_silent', '1', transientCookieOptions());
  }

  const params = new URLSearchParams({
    client_id: oidcConfig.clientId,
    redirect_uri: oidcConfig.redirectUri,
    response_type: 'code',
    scope: 'openid email profile offline_access',
    prompt: silent ? 'none' : 'consent',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  res.redirect(`${oidcConfig.authorizeUrl}?${params.toString()}`);
});

router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const cookieState = req.cookies?.oauth_state;
  const codeVerifier = req.cookies?.pkce_verifier;
  const next = sanitizeNextPath(req.cookies?.auth_next);
  const wasSilent = req.cookies?.auth_silent === '1';
  const origin = clientOrigin();

  /**
   * `prompt=none` resolves immediately with `error=login_required` /
   * `consent_required` / `interaction_required` when there is no existing
   * SSO session (or no grant yet for this client) — that is the normal,
   * expected outcome for a logged-out visitor, not a failure. Swallow it
   * silently and land back on the page the probe was started from; only
   * surface an error for the interactive (non-silent) flow.
   */
  if (typeof error === 'string') {
    clearTransientCookies(res);
    if (wasSilent) {
      return handleSilentAuthorizeError(res, error, next, origin);
    }
    return res.redirect(origin ? `${origin}${next}?authError=1` : `${next}?authError=1`);
  }

  if (
    typeof code !== 'string' ||
    typeof state !== 'string' ||
    !cookieState ||
    !codeVerifier ||
    state !== cookieState
  ) {
    clearTransientCookies(res);
    if (wasSilent) {
      return silentProbeDoneRedirect(res, next, origin);
    }
    return res.status(400).json({ error: 'invalid_state_or_code' });
  }

  try {
    const tokenResponse = await fetch(oidcConfig.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: oidcConfig.redirectUri,
        client_id: oidcConfig.clientId,
        code_verifier: codeVerifier,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      clearTransientCookies(res);
      if (wasSilent) {
        return silentProbeDoneRedirect(res, next, origin);
      }
      return res.status(400).json({ error: 'token_exchange_failed' });
    }

    const tokens = (await tokenResponse.json()) as {
      access_token?: string;
      refresh_token?: string;
      id_token?: string;
    };

    if (!tokens.access_token) {
      clearTransientCookies(res);
      if (wasSilent) {
        return silentProbeDoneRedirect(res, next, origin);
      }
      return res.status(400).json({ error: 'missing_access_token' });
    }

    await verifyAccessToken(tokens.access_token);

    const cookieOpts = tokenCookieOptions();
    res.cookie('access_token', tokens.access_token, cookieOpts);
    if (tokens.refresh_token) {
      res.cookie('refresh_token', tokens.refresh_token, cookieOpts);
    }
    if (tokens.id_token) {
      res.cookie('id_token', tokens.id_token, cookieOpts);
    }

    clearTransientCookies(res);
    return res.redirect(origin ? `${origin}${next}` : next);
  } catch (err) {
    console.error('OIDC callback error:', err);
    clearTransientCookies(res);
    clearTokenCookies(res);
    if (wasSilent) {
      return silentProbeDoneRedirect(res, next, origin);
    }
    return res.status(400).json({ error: 'authentication_failed' });
  }
});

router.get('/logout', (req, res) => {
  const idTokenHint = req.cookies?.id_token;
  clearTokenCookies(res);

  const params = new URLSearchParams({
    post_logout_redirect_uri: oidcConfig.postLogoutRedirectUri,
    state: oidcConfig.clientId,
  });
  if (idTokenHint) {
    params.set('id_token_hint', idTokenHint);
  }

  res.redirect(`${oidcConfig.endSessionUrl}?${params.toString()}`);
});

router.post('/backchannel-logout', async (req, res) => {
  const logoutToken = req.body?.logout_token;
  if (typeof logoutToken !== 'string' || !logoutToken) {
    res.status(400).end();
    return;
  }

  let payload;
  try {
    payload = await verifyLogoutToken(logoutToken);
  } catch {
    res.status(400).end();
    return;
  }

  try {
    /**
     * This clears cookies on the response to auth.tezzeract.com's own
     * request, which has no effect on any browser tab — kept only so a
     * same-origin caller gets a clean cookie jar too. The actual sign-out
     * for an already-open tab happens via `revokeSession` below, which
     * `getMe` checks on every request.
     */
    clearTokenCookies(res);
    if (typeof payload.sid === 'string') {
      await revokeSession(payload.sid);
    }
    res.status(200).end();
  } catch {
    // The token was valid but the revocation could not be stored. A 5xx
    // lets auth.tezzeract.com retry rather than assume the logout landed.
    res.status(500).end();
  }
});

export default router;
