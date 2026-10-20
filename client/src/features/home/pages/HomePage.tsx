import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { ArrowRight, Plus, Settings2, Loader2 } from "lucide-react";
import { useOidcSession, type OidcClaims } from "@/shared/hooks/useOidcSession";

function displayNameFromClaims(claims: OidcClaims | null): string {
  if (typeof claims?.name === "string" && claims.name.trim()) {
    return claims.name.trim();
  }
  if (
    typeof claims?.preferred_username === "string" &&
    claims.preferred_username.trim()
  ) {
    return claims.preferred_username.trim();
  }
  if (typeof claims?.email === "string" && claims.email.trim()) {
    return claims.email.trim();
  }
  return "Account";
}

export default function HomePage() {
  const { authenticated, loading: oidcLoading, claims } = useOidcSession();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const displayName = displayNameFromClaims(claims);

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

  return (
    <div className="flex flex-col bg-[#010101] bg-[url('/Tezzeract_3d_bg.webp')] bg-no-repeat bg-[center_10rem] h-[100vh] justify-center relative">
      {!oidcLoading && (
        <div className="absolute top-6 right-8 z-10 flex items-center gap-3">
          {authenticated ? (
            <>
              <span className="text-white text-sm font-medium max-w-[16rem] truncate">
                {displayName}
              </span>
              <a
                href="/auth/logout"
                className="inline-flex items-center justify-center h-10 px-5 rounded-xl border border-white/40 text-white text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Sign out
              </a>
            </>
          ) : (
            <a
              href="/auth/login"
              className="inline-flex items-center justify-center h-10 px-6 rounded-xl border border-white/40 text-white text-sm font-medium bg-[radial-gradient(64.46%_80%_at_50.53%_0%,#009BE9_0%,#00378A_100%)] hover:shadow-[0_0_10px_0_rgba(0,169,238,0.40)] transition-shadow"
            >
              Sign in
            </a>
          )}
        </div>
      )}
      <h1 className="text-white text-center text-7xl font-thin mb-8">
        Start exploring talent,
        <br /> form Talent & Start Growing!
      </h1>

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
    </div>
  );
}
