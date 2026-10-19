import { Request, Response } from 'express';
import { verifyAccessToken } from '../utils/oidc.js';

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
    return res.status(200).json({ claims });
  } catch {
    return res.status(401).json({ error: 'unauthenticated' });
  }
}
