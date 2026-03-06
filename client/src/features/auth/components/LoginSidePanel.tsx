import { useState, useEffect, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTeamStore } from "@/shared/stores/useTeamStore";
import { supabase } from "@/shared/lib/supabase";
import { Button } from "@/shared/components/ui/Button";
import { TezzeractButton } from "@/shared/components/ui/TezzeractButton";
import { Input } from "@/shared/components/ui/Input";

const ANIMATION_DURATION_MS = 300;

interface LoginSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginSidePanel({ isOpen, onClose }: LoginSidePanelProps) {
  const navigate = useNavigate();
  const { team } = useTeamStore();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { user, signInWithGoogle } = useAuth();

  // Keep mounted during close animation
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
    } else {
      const timer = setTimeout(() => setIsMounted(false), ANIMATION_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Trigger slide-in: render off-screen first, then animate in on next frame
  useLayoutEffect(() => {
    if (isOpen) {
      setIsVisible(false);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Redirect to CreateMeetingPage after successful login if team exists
  useEffect(() => {
    if (user && team.length > 0 && isOpen) {
      onClose();
      setTimeout(() => {
        navigate("/talent/create-meeting");
      }, 500);
    }
  }, [user, team.length, isOpen, navigate, onClose]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
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
      await signInWithGoogle("/");
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
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-40" aria-hidden={!isOpen}>
      {/* Backdrop - pointer-events-none when closed to prevent blink */}
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity ease-out ${
          isVisible ? "opacity-100" : "opacity-0"
        } ${!isVisible ? "pointer-events-none" : ""}`}
        style={{
          transitionDuration: `${ANIMATION_DURATION_MS}ms`,
          transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onClick={onClose}
      />

      {/* Slide-in Panel from Right */}
      <div
        className={`fixed top-0 right-0 h-full w-[40%] min-w-[320px] bg-white shadow-2xl z-10 transition-transform ease-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          transitionDuration: `${ANIMATION_DURATION_MS}ms`,
          transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full flex flex-col p-8">
          {/* Close Button */}
         
      

          {/* Content */}
          <div className="h-full flex flex-col justify-center  w-[60%] mx-auto">
            <h1 className="text-2xl text-center font-normal text-gray-900 mb-2">
              Create an account
            </h1>
            <p className="text-gray-500 mb-8 text-center">
              Enter your email below to create your account
            </p>

            <form onSubmit={handleEmailSignIn} className="space-y-6 w-full">
              <div>
                <Input
                  type="email"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading || emailSent}
                  className="w-full h-12 text-base rounded-xl transition-all duration-200 "
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              {emailSent && (
                <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
                  Check your email! We&apos;ve sent you a sign-in link.
                </div>
              )}

              <div className="flex justify-center">
                <TezzeractButton
                  type="submit"
                  disabled={isLoading || emailSent}
                  fullWidth={false}
                  className="h-12 min-w-[200px]"
                >
                  {isLoading ? "Sending..." : emailSent ? "Email Sent!" : "Sign In with Email"}
                </TezzeractButton>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500 uppercase tracking-wide">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Button */}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl  border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
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
              </div>

              {/* LinkedIn Button */}
              <div>
                <Button
                  type="button"
                  onClick={handleLinkedInSignIn}
                  disabled={isLoading}
                  className="w-full h-12 text-base rounded-xl font-medium bg-[#0077B5] hover:bg-[#006399] text-white shadow-md flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </Button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            By clicking continue, you agree to our{" "}
            <a
              href="/terms"
              className="text-gray-700 hover:text-gray-900 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="text-gray-700 hover:text-gray-900 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
