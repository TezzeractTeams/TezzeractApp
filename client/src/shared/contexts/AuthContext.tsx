import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { OidcClaims } from '../types/oidc';

/** Minimal user shape for UI components (OIDC-primary). */
export interface AppUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    phone?: string;
  };
}

interface AuthContextType {
  user: AppUser | null;
  session: { access_token: string } | null;
  loading: boolean;
  oidcClaims: OidcClaims | null;
  oidcAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => void;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  refreshOidcSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function claimsToUser(claims: OidcClaims | null): AppUser | null {
  if (!claims?.sub) return null;
  const name =
    typeof claims.name === 'string'
      ? claims.name
      : typeof claims.preferred_username === 'string'
        ? claims.preferred_username
        : undefined;
  const picture =
    typeof claims.picture === 'string' ? claims.picture : undefined;
  return {
    id: claims.sub,
    email: typeof claims.email === 'string' ? claims.email : undefined,
    user_metadata: {
      full_name: name,
      avatar_url: picture,
    },
  };
}

/**
 * Set once this tab has already tried the silent SSO probe, so a genuinely
 * logged-out visitor only bounces through `/auth/login?silent=1` once per
 * tab rather than on every mount/remount.
 */
const SILENT_SSO_ATTEMPTED_KEY = 'tz_silent_sso_attempted';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [oidcClaims, setOidcClaims] = useState<OidcClaims | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshOidcSession = useCallback(async () => {
    try {
      const res = await fetch('/api/me', { credentials: 'include' });
      // #region agent log
      fetch('http://127.0.0.1:7850/ingest/ff32a892-6f20-4005-9c7a-0f72065e67d5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '42535a' },
        body: JSON.stringify({
          sessionId: '42535a',
          runId: 'pre-fix',
          hypothesisId: 'C',
          location: 'AuthContext.tsx:refreshOidcSession',
          message: '/api/me response',
          data: { status: res.status, ok: res.ok },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      if (res.ok) {
        const data = (await res.json()) as { claims: OidcClaims };
        setOidcClaims(data.claims);
        return true;
      }
      setOidcClaims(null);
      return false;
    } catch {
      setOidcClaims(null);
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const authenticated = await refreshOidcSession();
      if (cancelled) return;

      if (!authenticated) {
        // Try a silent cross-app SSO probe once per tab: if another
        // Tezzeract product already signed this browser in, this bounces
        // through auth.tezzeract.com with prompt=none and comes straight
        // back signed in, with no visible redirect for the common case.
        // A genuinely logged-out visitor also round-trips once (quickly,
        // via login_required) and is then left alone on this page.
        let alreadyAttempted = true;
        try {
          alreadyAttempted = sessionStorage.getItem(SILENT_SSO_ATTEMPTED_KEY) === '1';
        } catch {
          // sessionStorage unavailable (e.g. privacy mode) — skip the probe.
        }

        // #region agent log
        fetch('http://127.0.0.1:7850/ingest/ff32a892-6f20-4005-9c7a-0f72065e67d5', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '42535a' },
          body: JSON.stringify({
            sessionId: '42535a',
            runId: 'pre-fix',
            hypothesisId: 'A',
            location: 'AuthContext.tsx:useEffect',
            message: 'silent SSO branch',
            data: { authenticated, alreadyAttempted },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion

        if (!alreadyAttempted) {
          try {
            sessionStorage.setItem(SILENT_SSO_ATTEMPTED_KEY, '1');
          } catch {
            // Ignore — worst case the probe runs again next load.
          }
          const next = `${window.location.pathname}${window.location.search}`;
          window.location.assign(
            `/auth/login?silent=1&next=${encodeURIComponent(next)}`
          );
          return;
        }
      }

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshOidcSession]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void refreshOidcSession();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refreshOidcSession]);

  const user = claimsToUser(oidcClaims);
  const oidcAuthenticated = user !== null;
  const session = oidcAuthenticated ? { access_token: 'cookie' } : null;

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
      },
    });
    return { error };
  };

  const signInWithGoogle = async (redirectTo = '/') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`}`,
      },
    });
    if (error) {
      console.error('Google sign-in error:', error);
    }
  };

  const signOut = () => {
    try {
      sessionStorage.removeItem(SILENT_SSO_ATTEMPTED_KEY);
    } catch {
      // Ignore — logout must still proceed.
    }
    window.location.href = '/auth/logout';
  };

  const value = {
    user,
    session,
    loading,
    oidcClaims,
    oidcAuthenticated,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    refreshOidcSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
