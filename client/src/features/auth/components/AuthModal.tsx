import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTeamStore } from "@/shared/stores/useTeamStore";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
}

export default function AuthModal({ isOpen, onClose, initialMode = "signin" }: AuthModalProps) {
  const navigate = useNavigate();
  const { team } = useTeamStore();
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authFormLoading, setAuthFormLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  
  // Redirect to CreateMeetingPage after successful login if team exists
  useEffect(() => {
    if (user && team.length > 0 && isOpen) {
      // User just logged in and has a team, redirect to CreateMeetingPage
      onClose();
      setTimeout(() => {
        navigate('/talent/create-meeting');
      }, 500);
    }
  }, [user, team.length, isOpen, navigate, onClose]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthFormLoading(true);
    setAuthError(null);

    try {
      const { error } = isSignUp 
        ? await signUp(email, password, fullName)
        : await signIn(email, password);

      if (error) {
        setAuthError(error.message);
      } else {
        onClose();
        setEmail("");
        setPassword("");
        setFullName("");
        if (isSignUp) {
          toast.success("Account created! Please check your email to verify your account.");
        }
      }
    } catch (error: any) {
      setAuthError(error.message || "An error occurred");
    } finally {
      setAuthFormLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthFormLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (error: any) {
      setAuthError(error.message || "Google sign-in failed");
      setAuthFormLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setAuthError(null);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" 
      onClick={onClose}
    >
      <div 
        className="bg-[#1a1a1a] rounded-xl p-8 max-w-md w-full mx-4 border border-white/20" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl text-white mb-4 font-light">
          {isSignUp ? "Sign Up" : "Sign In"}
        </h2>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <Input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={isSignUp}
                className="bg-white/10 text-white border-white/20 placeholder:text-white/50"
              />
            </div>
          )}
          
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/10 text-white border-white/20 placeholder:text-white/50"
            />
          </div>
          
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white/10 text-white border-white/20 placeholder:text-white/50"
            />
          </div>
          
          {authError && (
            <div className="text-red-400 text-sm">{authError}</div>
          )}
          
          {/* Google Sign In Button */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={authFormLoading}
            className="w-full border border-white/20 bg-transparent text-white hover:bg-white/10 flex items-center justify-center gap-2 h-10 px-4 py-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#1a1a1a] text-white/70">Or continue with email</span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={authFormLoading}
              className="flex-1 bg-gradient-to-r from-blue-800 to-blue-400 text-white"
            >
              {authFormLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              className="border border-white/20 bg-transparent text-white hover:bg-white/10 h-10 px-4 py-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Cancel
            </Button>
          </div>
          
          <div className="text-center text-white/70 text-sm">
            {isSignUp ? (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-blue-400 hover:underline"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-blue-400 hover:underline"
                >
                  Sign Up
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

