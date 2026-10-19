import { ReactNode, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.assign('/auth/login');
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#010101]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#010101]">
        <a href="/auth/login" className="text-white underline">
          Sign in
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
