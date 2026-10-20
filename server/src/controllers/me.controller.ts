import { Request, Response } from 'express';
import { verifyAccessToken } from '../utils/oidc.js';
import { isSessionRevoked } from '../utils/revokedSessions.js';

// GET /api/me — decoded OIDC access-token claims for the current session.
// NOTE: any `memberships`/`standing` claims are a point-in-time snapshot;
// treat as a cache valid for at most 15 minutes, never as a standing
// authorization decision. Re-check with the auth service before any
// consequential action.
export async function getMe(req: Request, res: Response) {
  const accessToken = req.cookies?.access_token;
  if (!accessToken) {
    return res.status(401).json({ error: 'unauthenticated' });
  }

  try {
    const claims = await verifyAccessToken(accessToken);
    // Signature + exp alone are not enough: a backchannel logout from
    // another Tezzeract product cannot clear this cookie (that POST never
    // reaches this browser), so a still-unexpired access token can outlive
    // the session it was issued for. Reject it if its `sid` was revoked.
    if (typeof claims.sid === 'string' && isSessionRevoked(claims.sid)) {
      return res.status(401).json({ error: 'unauthenticated' });
    }
    return res.status(200).json({ claims });
  } catch {
    return res.status(401).json({ error: 'unauthenticated' });
  }
}
