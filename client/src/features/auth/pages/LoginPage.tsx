import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/shared/contexts/AuthContext";
import { supabase } from "@/shared/lib/supabase";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  // Redirect authenticated users
  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}${from}`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setEmailSent(true);
        toast.success("Check your email for the sign-in link!");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle(from);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      toast.error("Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      toast.error("LinkedIn sign-in coming soon!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "LinkedIn sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-900">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-semibold text-gray-900 text-center mb-2">
          Sign in to your account
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Enter your email to receive a magic link
        </p>

        <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50/50">
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || emailSent}
              className="w-full h-12"
            />

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            {emailSent && (
              <div className="text-green-700 text-sm bg-green-50 p-3 rounded-lg">
                Check your email! We&apos;ve sent you a sign-in link.
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || emailSent}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "Sending..." : emailSent ? "Email Sent!" : "Sign in with Email"}
            </Button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50/50 text-gray-500">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleLinkedInSignIn}
              disabled={isLoading}
              className="w-full h-12 border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="#0A66C2"
                viewBox="0 0 24 24"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              Continue with LinkedIn
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-gray-600 text-sm">
          <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
