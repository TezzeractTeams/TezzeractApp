import { useState, useEffect } from "react";
import { useTeamStorage } from "@/shared/hooks/use-team-storage";
import { YourTeamSidePanel } from "../components/YourTeamSidePanel";
import { ChatPanel } from "../components/ChatPanel";
import { AvailableTalents } from "../components/AvailableTalents";
import { getTalents } from "@/shared/services/talentService";

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

export default function TalentPage() {
  const [allTalents, setAllTalents] = useState<Talent[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your AI talent recruiter. Tell me about your project and I'll help you find the perfect team members. What are you looking to build?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAddTalentForm, setShowAddTalentForm] = useState(false);
  const [showYourTeam, setShowYourTeam] = useState(false);
  const { team: yourTeam, addToTeam, removeFromTeam } = useTeamStorage();

  // Fetch talents from API on component mount
  useEffect(() => {
    const fetchTalents = async () => {
      try {
        setIsLoading(true);
        const response = await getTalents();
        setAllTalents(response.talents);
      } catch (error) {
        console.error('Failed to fetch talents:', error);
        // Fallback to empty array if API fails
        setAllTalents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTalents();
  }, []);

  // Auto-show YourTeam panel when there's at least one team member
  useEffect(() => {
    if (yourTeam.length > 0 && !showYourTeam) {
      setShowYourTeam(true);
    }
  }, [yourTeam.length, showYourTeam]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response with search results
    setTimeout(async () => {
      try {
        // Search talents based on input
        const response = await getTalents({ search: input.trim() });
        
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `I've found ${response.talents.length} talents that match your requirements. Here are the top candidates for your project:`,
          talents: response.talents,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiResponse]);
      } catch (error) {
        console.error('Search error:', error);
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I'm having trouble searching for talents right now. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAddToTeam = (talent: Talent) => {
    if (!yourTeam.some((t) => t.id === talent.id)) {
      addToTeam(talent);
      setShowYourTeam(true);
    }
  };

  const handleRemoveFromTeam = (talentId: string) => {
    removeFromTeam(talentId);
  };

  const latestTalents =
    messages
      .slice()
      .reverse()
      .find((m) => m.role === "assistant" && m.talents && m.talents.length >= 0)
      ?.talents || [];

  const hasUserMessage = messages.some(m => m.role === "user");

  return (
    <div className="flex flex-col p-4 h-screen bg-[#fafafa] transition-all duration-500 ease-in-out">
      <div className="flex-1 overflow-hidden animate-fade-in flex gap-4">
        {/* Chat Panel */}
        <div 
          className="flex-shrink-0 transition-all duration-300 ease-out" 
          style={{ width: showYourTeam ? '25%' : '28%' }}
        >
          <ChatPanel
            messages={messages}
            input={input}
            isLoading={isLoading}
            onInputChange={setInput}
            onSendMessage={handleSendMessage}
            onKeyPress={handleKeyPress}
            onShowAddTalentForm={() => setShowAddTalentForm(true)}
            hasUserMessage={hasUserMessage}
          />
        </div>

        {/* Available Talents */}
        <div className="flex-1 transition-all duration-300 ease-out">
          <AvailableTalents
            talents={hasUserMessage ? latestTalents : allTalents}
            isLoading={isLoading}
            hasUserMessage={hasUserMessage}
            yourTeam={yourTeam}
            onAddToTeam={handleAddToTeam}
            onRemoveFromTeam={removeFromTeam}
            showYourTeam={showYourTeam}
          />
        </div>

        {/* Your Team Side Panel */}
        {showYourTeam && (
          <div className="w-80 flex-shrink-0 transition-all duration-300 ease-out">
            <YourTeamSidePanel
              team={yourTeam}
              onClose={() => setShowYourTeam(false)}
              onRemoveFromTeam={handleRemoveFromTeam}
            />
          </div>
        )}
      </div>
    </div>
  );
}