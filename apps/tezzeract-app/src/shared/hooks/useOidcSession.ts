import { useEffect, useState } from 'react';

// Claims cache window: any `memberships`/`standing`-style claims returned by
// /api/me are a point-in-time snapshot from the auth service, valid as a
// cache for at most this long. NEVER treat them as a standing authorization
// decision — re-check with the server before any consequential action.
export const CLAIMS_CACHE_MS = 15 * 60 * 1000; // 15 minutes

export interface OidcClaims {
  sub?: string;
  email?: string;
  name?: string;
  memberships?: unknown;
  standing?: unknown;
  [key: string]: unknown;
}

interface OidcSessionState {
  claims: OidcClaims | null;
  loading: boolean;
  fetchedAt: number | null;
}

/**
 * Tracks the current OIDC session (separate from the existing Supabase
 * AuthContext) by calling GET /api/me on mount. Tokens themselves are never
 * exposed to the client — they live only in HttpOnly cookies set by the
 * gateway's /auth routes.
 */
export function useOidcSession(): OidcSessionState {
  const [claims, setClaims] = useState<OidcClaims | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/me', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          if (!cancelled) {
            setClaims(null);
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setClaims(data.claims ?? null);
          setFetchedAt(Date.now());
        }
      })
      .catch(() => {
        if (!cancelled) {
          setClaims(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { claims, loading, fetchedAt };
}
