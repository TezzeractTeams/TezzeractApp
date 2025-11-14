import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { ArrowRight, Plus, Settings2, Loader2 } from "lucide-react";
import { useTeamStorage } from "@/shared/hooks/use-team-storage";

interface Talent {
  id: string;
  image_url: string;
  name: string;
  skills: string[];
  experience_years: number;
  availability: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  talents?: Talent[];
  timestamp: Date;
}

export default function HomePage() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { team: yourTeam } = useTeamStorage();
  const navigate = useNavigate();
  const [messages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your AI talent recruiter. Tell me about your project and I'll help you find the perfect team members. What are you looking to build?",
      timestamp: new Date(),
    },
  ]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };


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
    <div className="flex flex-col bg-[#010101] bg-[url('/Tezzeract_3d_bg.webp')] bg-no-repeat bg-[center_10rem] h-[100vh] justify-center">
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
