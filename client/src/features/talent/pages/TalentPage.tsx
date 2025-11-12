import { useState, useEffect } from "react";
import { useTeamStorage } from "@/shared/hooks/use-team-storage";
import { YourTeamSidePanel } from "../components/YourTeamSidePanel";
import { ChatPanel } from "../components/ChatPanel";
import { AvailableTalents } from "../components/AvailableTalents";

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

// Mock data for talents - in production, this would come from your API
const mockTalents: Talent[] = [
  {
    id: "1",
    name: "John Doe",
    skills: ["React", "Node.js", "TypeScript", "GraphQL"],
    image_url: "https://randomuser.me/api/portraits/men/1.jpg",
    experience_years: 5,
    availability: true,
  },
  {
    id: "2",
    name: "Jane Smith",
    skills: ["Product Management", "Agile", "Scrum", "Data Analysis"],
    image_url: "https://randomuser.me/api/portraits/women/2.jpg",
    experience_years: 7,
    availability: true,
  },
  {
    id: "3",
    name: "Mike Johnson",
    skills: ["UX Design", "Figma", "Prototyping", "User Research"],
    image_url: "https://randomuser.me/api/portraits/men/3.jpg",
    experience_years: 4,
    availability: false,
  },
  {
    id: "4",
    name: "Sarah Williams",
    skills: ["Python", "Machine Learning", "TensorFlow", "Data Science"],
    image_url: "https://randomuser.me/api/portraits/women/4.jpg",
    experience_years: 6,
    availability: true,
  },
  {
    id: "5",
    name: "David Brown",
    skills: ["DevOps", "AWS", "Docker", "Kubernetes"],
    image_url: "https://randomuser.me/api/portraits/men/5.jpg",
    experience_years: 8,
    availability: true,
  },
  {
    id: "6",
    name: "Emily Davis",
    skills: ["Marketing", "SEO", "Content Strategy", "Analytics"],
    image_url: "https://randomuser.me/api/portraits/women/6.jpg",
    experience_years: 3,
    availability: true,
  },
];

export default function TalentPage() {
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

    // Simulate AI response - in production, this would call your backend API
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I've found some great talents that match your requirements. Here are the top candidates for your project:",
        talents: mockTalents.slice(0, 4), // Show first 4 talents as results
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
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
          style={{ width: showYourTeam ? '30%' : '32%' }}
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
            talents={hasUserMessage ? latestTalents : mockTalents}
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