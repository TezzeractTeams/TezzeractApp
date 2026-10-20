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
  refreshOidcSession: () => Promise<void>;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [oidcClaims, setOidcClaims] = useState<OidcClaims | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshOidcSession = useCallback(async () => {
    try {
      const res = await fetch('/api/me', { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as { claims: OidcClaims };
        setOidcClaims(data.claims);
      } else {
        setOidcClaims(null);
      }
    } catch {
      setOidcClaims(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refreshOidcSession();
      if (!cancelled) setLoading(false);
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
