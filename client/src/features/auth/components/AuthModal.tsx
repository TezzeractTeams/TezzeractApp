import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTeamStore } from "@/shared/stores/useTeamStore";
import { supabase } from "@/shared/lib/supabase";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
}

export default function AuthModal({ isOpen, onClose, initialMode = "signin" }: AuthModalProps) {
  const { team } = useTeamStore();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { user } = useAuth();

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      // Delay unmounting to allow exit animation
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close modal after successful login - redirect happens only when user confirms in chat
  useEffect(() => {
    if (user && team.length > 0 && isOpen) {
      onClose();
    }
  }, [user, team.length, isOpen, onClose]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Use magic link (passwordless) authentication
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
    } catch (error: any) {
      setError(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Implement LinkedIn OAuth
      // For now, show a message
      toast.error("LinkedIn sign-in coming soon!");
      setIsLoading(false);
    } catch (error: any) {
      setError(error.message || "LinkedIn sign-in failed");
      setIsLoading(false);
    }
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-500 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Slide Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform ${
          isOpen 
            ? 'translate-x-0 opacity-100' 
            : 'translate-x-full opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full flex flex-col p-8">
          {/* Close Button */}
          <button
            onClick={onClose}
            className={`absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-all duration-300 delay-100 ${
              isOpen 
                ? 'opacity-100 rotate-0 scale-100' 
                : 'opacity-0 rotate-90 scale-75'
            }`}
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Content */}
          <div 
            className={`flex-1 flex flex-col justify-center transition-all duration-700 delay-100 ${
              isOpen 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}
          >
            <h1 
              className={`text-3xl font-semibold text-gray-900 mb-2 transition-all duration-500 delay-150 ${
                isOpen 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-2'
              }`}
            >
              Create an account
            </h1>
            <p 
              className={`text-gray-500 mb-8 transition-all duration-500 delay-200 ${
                isOpen 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-2'
              }`}
            >
              Enter your email below to create your account
            </p>

            <form 
              onSubmit={handleEmailSignIn} 
              className={`space-y-6 transition-all duration-500 delay-300 ${
                isOpen 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4'
              }`}
            >
              {/* Email Input */}
              <div 
                className={`transition-all duration-500 delay-350 ${
                  isOpen 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-2'
                }`}
              >
                <Input
                  type="email"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading || emailSent}
                  className="w-full h-12 text-base transition-all duration-200 focus:scale-[1.02]"
                />
              </div>

              {error && (
                <div 
                  className={`text-red-500 text-sm transition-all duration-300 ${
                    isOpen 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-2'
                  }`}
                >
                  {error}
                </div>
              )}

              {emailSent && (
                <div 
                  className={`text-green-600 text-sm bg-green-50 p-3 rounded-md transition-all duration-300 ${
                    isOpen 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-2'
                  }`}
                >
                  Check your email! We've sent you a sign-in link.
                </div>
              )}

              {/* Sign In with Email Button */}
              <div
                className={`transition-all duration-500 delay-400 ${
                  isOpen 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-2'
                }`}
              >
                <Button
                  type="submit"
                  disabled={isLoading || emailSent}
                  className="w-full h-12 text-base font-medium bg-gradient-to-b from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? "Sending..." : emailSent ? "Email Sent!" : "Sign In with Email"}
                </Button>
              </div>

              {/* Divider */}
              <div 
                className={`relative transition-all duration-500 delay-450 ${
                  isOpen 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-2'
                }`}
              >
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500 uppercase tracking-wide">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* LinkedIn Button */}
              <div
                className={`transition-all duration-500 delay-500 ${
                  isOpen 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-2'
                }`}
              >
                <Button
                  type="button"
                  onClick={handleLinkedInSignIn}
                  disabled={isLoading}
                  className="w-full h-12 text-base font-medium bg-[#0077B5] hover:bg-[#006399] text-white shadow-md flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
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
          <div 
            className={`mt-8 text-center text-sm text-gray-500 transition-all duration-500 delay-600 ${
              isOpen 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-2'
            }`}
          >
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
    </>
  );
}

