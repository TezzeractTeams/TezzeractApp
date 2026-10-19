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

const router = Router();

function clearTransientCookies(res: import('express').Response) {
  res.clearCookie('pkce_verifier', { path: '/' });
  res.clearCookie('oauth_state', { path: '/' });
}

function clearTokenCookies(res: import('express').Response) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
  res.clearCookie('id_token', { path: '/' });
}

router.get('/login', (_req, res) => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();

  res.cookie('pkce_verifier', codeVerifier, transientCookieOptions());
  res.cookie('oauth_state', state, transientCookieOptions());

  const params = new URLSearchParams({
    client_id: oidcConfig.clientId,
    redirect_uri: oidcConfig.redirectUri,
    response_type: 'code',
    scope: 'openid email profile offline_access',
    prompt: 'consent',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  res.redirect(`${oidcConfig.authorizeUrl}?${params.toString()}`);
});

router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const cookieState = req.cookies?.oauth_state;
  const codeVerifier = req.cookies?.pkce_verifier;

  if (
    typeof code !== 'string' ||
    typeof state !== 'string' ||
    !cookieState ||
    !codeVerifier ||
    state !== cookieState
  ) {
    clearTransientCookies(res);
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
      return res.status(400).json({ error: 'token_exchange_failed' });
    }

    const tokens = (await tokenResponse.json()) as {
      access_token?: string;
      refresh_token?: string;
      id_token?: string;
    };

    if (!tokens.access_token) {
      clearTransientCookies(res);
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
    const clientOrigin = (process.env.CLIENT_URL || '').replace(/\/$/, '');
    return res.redirect(clientOrigin ? `${clientOrigin}/` : '/');
  } catch (err) {
    console.error('OIDC callback error:', err);
    clearTransientCookies(res);
    clearTokenCookies(res);
    return res.status(400).json({ error: 'authentication_failed' });
  }
});

router.get('/logout', (req, res) => {
  const idTokenHint = req.cookies?.id_token;
  clearTokenCookies(res);

  const params = new URLSearchParams({
    post_logout_redirect_uri: oidcConfig.postLogoutRedirectUri,
  });
  if (idTokenHint) {
    params.set('id_token_hint', idTokenHint);
  }

  res.redirect(`${oidcConfig.endSessionUrl}?${params.toString()}`);
});

export default router;
