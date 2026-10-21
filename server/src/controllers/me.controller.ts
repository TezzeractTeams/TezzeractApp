import { Request, Response } from 'express';
import { tokenCookieOptions, verifyAccessToken } from '../utils/oidc.js';
import { isSessionRevoked } from '../utils/revokedSessions.js';
import { refreshSession } from '../utils/sessionRefresh.js';

// GET /api/me — decoded OIDC access-token claims for the current session.
// NOTE: any `memberships`/`standing` claims are a point-in-time snapshot;
// treat as a cache valid for at most 15 minutes, never as a standing
// authorization decision. Re-check with the auth service before any
// consequential action.

function clearAuthCookies(res: Response) {
  for (const name of ['access_token', 'refresh_token', 'id_token']) {
    res.clearCookie(name, { path: '/' });
  }
}

export async function getMe(req: Request, res: Response) {
  const accessToken = req.cookies?.access_token;
  const refreshToken = req.cookies?.refresh_token;

  if (accessToken) {
    try {
      const claims = await verifyAccessToken(accessToken);
      // Signature + exp alone are not enough: a backchannel logout from
      // another Tezzeract product cannot clear this cookie (that POST never
      // reaches this browser), so a still-unexpired access token can outlive
      // the session it was issued for. Reject it if its `sid` was revoked.
      if (typeof claims.sid === 'string' && (await isSessionRevoked(claims.sid))) {
        clearAuthCookies(res);
        return res.status(401).json({ error: 'unauthenticated' });
      }
      return res.status(200).json({ claims });
    } catch {
      // Expired or invalid: fall through to a refresh if we can.
    }
  }

  if (!refreshToken) {
    return res.status(401).json({ error: 'unauthenticated' });
  }

  const outcome = await refreshSession(refreshToken);
  switch (outcome.kind) {
    case 'ok': {
      const options = tokenCookieOptions();
      res.cookie('access_token', outcome.tokens.access_token, options);
      if (outcome.tokens.refresh_token) {
        res.cookie('refresh_token', outcome.tokens.refresh_token, options);
      }
      if (outcome.tokens.id_token) {
        res.cookie('id_token', outcome.tokens.id_token, options);
      }
      return res.status(200).json({ claims: outcome.claims });
    }
    case 'shared':
      return res.status(200).json({ claims: outcome.claims });
    case 'revoked':
      clearAuthCookies(res);
      return res.status(401).json({ error: 'unauthenticated' });
    default:
      clearAuthCookies(res);
      return res.status(401).json({ error: 'unauthenticated' });
  }
}
