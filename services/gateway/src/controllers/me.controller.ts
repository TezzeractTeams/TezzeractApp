import type { Request, Response } from 'express';
import { verifyAccessToken } from '../utils/oidc.js';

// GET /api/me
// Returns the decoded OIDC access-token claims for the current session, or
// 401 if there is no valid session. The frontend uses this to determine
// auth state on load. NOTE: any `memberships`/`standing` claims returned
// here are a point-in-time snapshot — treat as a cache valid for at most
// 15 minutes, never as a standing authorization decision. Re-check with
// the auth service before any consequential action.
export async function getMe(req: Request, res: Response) {
  const accessToken = req.cookies?.access_token;

  if (!accessToken) {
    return res.status(401).json({ error: 'unauthenticated' });
  }

  try {
    const claims = await verifyAccessToken(accessToken);
    return res.status(200).json({ claims });
  } catch (err) {
    return res.status(401).json({ error: 'unauthenticated' });
  }
}
