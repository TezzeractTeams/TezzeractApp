import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { OidcClaims } from '../types/oidc';
import {
  broadcastLogout,
  handleUnauthorized,
  listenForLogout,
  startSessionPolling,
} from '../lib/authSession';

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
 * Set when the silent SSO round-trip completes without signing in, so a
 * logged-out visitor is not sent through `/auth/login?silent=1` on every
 * navigation. Not set before the redirect — only after the server marks
 * the probe done via `?silent_sso=done`.
 */
const SILENT_SSO_COMPLETED_KEY = 'tz_silent_sso_completed';

function consumeSilentSsoDoneMarker(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('silent_sso') !== 'done') return;
    params.delete('silent_sso');
    const qs = params.toString();
    const clean = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', clean);
    sessionStorage.setItem(SILENT_SSO_COMPLETED_KEY, '1');
  } catch {
    // sessionStorage unavailable — probe may repeat once per load.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [oidcClaims, setOidcClaims] = useState<OidcClaims | null>(null);
  const [loading, setLoading] = useState(true);
  // True once this tab has seen a signed-in session, so a later 401 means the
  // session was lost (logout elsewhere) rather than a normal anonymous visit.
  const wasAuthenticatedRef = useRef(false);

  const refreshOidcSession = useCallback(async () => {
    try {
      const res = await fetch('/api/me', { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as { claims: OidcClaims };
        setOidcClaims(data.claims);
        wasAuthenticatedRef.current = true;
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
      consumeSilentSsoDoneMarker();

      const authenticated = await refreshOidcSession();
      if (cancelled) return;

      if (!authenticated) {
        // Try a silent cross-app SSO probe once per tab: if another
        // Tezzeract product already signed this browser in, this bounces
        // through auth.tezzeract.com with prompt=none and comes straight
        // back signed in, with no visible redirect for the common case.
        // If the user has an SSO session but no grant for `app` yet,
        // the server chains to interactive login (auto-continue at auth).
        let silentProbeCompleted = true;
        try {
          silentProbeCompleted =
            sessionStorage.getItem(SILENT_SSO_COMPLETED_KEY) === '1';
        } catch {
          // sessionStorage unavailable — skip the probe.
        }

        if (!silentProbeCompleted) {
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

  // Re-check on tab focus and every 60 s while visible; if a session that
  // existed is gone, send the user to /auth/login like every other 401.
  useEffect(() => {
    return startSessionPolling(async () => {
      const authenticated = await refreshOidcSession();
      if (!authenticated && wasAuthenticatedRef.current) handleUnauthorized();
    });
  }, [refreshOidcSession]);

  // Another tab of this origin signed out.
  useEffect(() => {
    return listenForLogout(() => {
      setOidcClaims(null);
      if (wasAuthenticatedRef.current) handleUnauthorized();
    });
  }, []);

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
      sessionStorage.removeItem(SILENT_SSO_COMPLETED_KEY);
      sessionStorage.removeItem('tz_silent_sso_attempted');
    } catch {
      // Ignore — logout must still proceed.
    }
    // Tell other tabs first, then end the SSO session in this one.
    broadcastLogout();
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
