import { useAuth } from '../contexts/AuthContext';
import type { OidcClaims } from '../types/oidc';

export type { OidcClaims };

export interface OidcSessionState {
  claims: OidcClaims | null;
  loading: boolean;
  authenticated: boolean;
}

/** OIDC session from GET /api/me (HttpOnly cookie). Use inside AuthProvider. */
export function useOidcSession(): OidcSessionState {
  const { oidcClaims, loading, oidcAuthenticated } = useAuth();
  return {
    claims: oidcClaims,
    loading,
    authenticated: oidcAuthenticated,
  };
}
