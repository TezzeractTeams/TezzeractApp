import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/contexts/AuthContext";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { ArrowRight, Plus, Settings2, Loader2 } from "lucide-react";


export default function HomePage() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authFormLoading, setAuthFormLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithGoogle } = useAuth();

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);

    // Simulate AI response for demo
    setTimeout(() => {
      // Navigate to talent page with search context
      navigate("/talent", {
        state: {
          searchQuery: input.trim(),
        },
      });
      setIsLoading(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
        setShowAuthModal(false);
        setEmail("");
        setPassword("");
        setFullName("");
        if (isSignUp) {
          // Show success message for sign up
          alert("Account created! Please check your email to verify your account.");
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
    } catch (error: any) {
      setAuthError(error.message || "Google sign-in failed");
      setAuthFormLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#010101] bg-[url('/Tezzeract_3d_bg.webp')] bg-no-repeat bg-[center_10rem] h-[100vh] justify-center">
      <h1 className="text-white text-center text-7xl font-thin mb-8">
        Start exploring talent,
        <br /> form Talent & Start Growing!
      </h1>

      {/* Show Sign In/Sign Up buttons if not signed in */}
      {!user && (
        <div className="flex gap-4 justify-center mb-8">
          <button 
            onClick={() => {
              setIsSignUp(false);
              setShowAuthModal(true);
            }}
            className="px-8 py-3 bg-gradient-to-r from-blue-800 to-blue-400 text-white rounded-xl hover:opacity-90 transition-all font-light"
          >
            Sign In
          </button>
          <button 
            onClick={() => {
              setIsSignUp(true);
              setShowAuthModal(true);
            }}
            className="px-8 py-3 border border-white text-white rounded-xl hover:bg-white hover:text-black transition-all font-light"
          >
            Sign Up
          </button>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAuthModal(false)}>
          <div className="bg-[#1a1a1a] rounded-xl p-8 max-w-md w-full mx-4 border border-white/20" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl text-white mb-4 font-light">{isSignUp ? "Sign Up" : "Sign In"}</h2>
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
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10 flex items-center justify-center gap-2"
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
                  onClick={() => setShowAuthModal(false)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
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
                      onClick={() => setIsSignUp(false)}
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
                      onClick={() => setIsSignUp(true)}
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
      )}

      {/* Show search input only if signed in */}
      {user && (
        <div className="w-2/5 p-4 pb-4 rounded-[30px] border border-white/30 bg-white/20 shadow-md self-center backdrop-blur-sm">
          <div className="w-full">
            <div className="flex flex-col gap-2">
              <div className="relative w-full">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Start searching your dream team...."
                  className="bg-transparent font-mono text-white placeholder-white border-none focus:border-none focus:ring-0 !focus:outline-none disabled:border-none disabled:ring-0 disabled:outline-none pr-10"
                  disabled={isLoading}
                />
                {isLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-white" />
                )}
              </div>
              
              <div className="flex flex-row p-2 rounded-lg gap-2">
                <Button
                  disabled={isLoading}
                  variant="outline"
                  className="rounded-xl w-10 h-10 p-0 text-white border-white bg-transparent hover:bg-white/10"
                >
                  <Plus className="w-6 h-6 text-white" />
                </Button>

                <Button
                  disabled={!input.trim() || isLoading}
                  variant="outline"
                  className="rounded-xl w-10 h-10 p-0 text-white border-white bg-transparent hover:bg-white/10"
                >
                  <Settings2 className="w-6 h-6 text-white" />
                </Button>

                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="rounded-xl w-10 h-10 p-0 text-white ml-auto border border-white"
                  style={{
                    background: "linear-gradient(45deg, #272727 10%, #515151 100%)",
                  }}
                >
                  <ArrowRight
                    className="w-6 h-6 text-white"
                    style={{ filter: "drop-shadow(0 0 4px white)" }}
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
