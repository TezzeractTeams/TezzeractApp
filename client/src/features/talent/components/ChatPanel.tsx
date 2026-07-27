import { useRef, useEffect } from "react";
import { Button } from "@/shared/components/ui/Button";
import { TezzeractSendButton } from "@/shared/components/ui/TezzeractSendButton";
import { Input } from "@/shared/components/ui/Input";
import { ChatMessage } from "./ChatMessage";
import { SuggestedSkillButton } from "./SuggestedSkillButton";
import { Loader2, Settings2, ArrowRight, Sparkles, Trash2 } from "lucide-react";
import TezzeractTextLogo from "@/assets/images/TezzeractTextLogo.png";
import sparklesImage from "@/assets/images/sparkles.png";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTeamStore } from "@/shared/stores/useTeamStore";


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
  type?: "text" | "organization_form" | "company_size" | "login_button";
  talents?: Talent[];
  timestamp: Date;
}

interface ChatPanelProps {
  messages: Message[];
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  hasUserMessage: boolean;
  suggestedSkills: string[];
  selectedSkillFilters: string[];
  onSkillFilterToggle: (skill: string) => void;
  onLoginClick?: () => void;
  onClearChat?: () => void;
}

export function ChatPanel({
  messages,
  input,
  isLoading,
  onInputChange,
  onSendMessage,
  onKeyPress,
  hasUserMessage,
  suggestedSkills,
  selectedSkillFilters,
  onSkillFilterToggle,
  onLoginClick,
  onClearChat,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { team } = useTeamStore();
  
  // Filter out login_button only when user is logged in but has no team (nothing to confirm).
  // When user is logged in with team, keep login_button so they see team confirmation and can click to continue.
  const filteredMessages = user && team.length === 0
    ? messages.filter((msg) => msg.type !== 'login_button')
    : messages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  // Focus input when switching back to welcome screen (after clearing history)
  useEffect(() => {
    if (!hasUserMessage && !isLoading && inputRef.current) {
      // Small delay to ensure the DOM has updated
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Ensure input is clickable by removing any potential disabled state
          inputRef.current.disabled = false;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasUserMessage, isLoading]);

  if (hasUserMessage) {
    return (
      <div className="flex flex-col h-full bg-[#FAFAFA] transition-all duration-300 ease-in-out rounded-3xl overflow-hidden relative">
        {/* Logo at top left - overlaying the messages */}
        <div 
          className="absolute top-0 left-0 right-0 pl-8 pr-8 h-[112px] flex items-center justify-between gap-2 z-10"
          style={{
            background: 'linear-gradient(181.12deg, rgba(250, 250, 250, 1) 60%, rgba(250, 250, 250, 0.2) 100%)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(1px)'
          }}
        >
          <img src={TezzeractTextLogo} alt="Tezzeract logo" className="h-4 z-100000" />
          <div className="flex items-center gap-2 z-100000">
            {!user && onLoginClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onLoginClick}
                className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Log innnnn
              </Button>
            )}
            {onClearChat && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all chat history? This will remove all messages and reset the conversation.')) {
                    onClearChat();
                  }
                }}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                title="Clear chat history"
              >
                <Trash2 className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>
        <div className="px-4  z-0 flex-1 overflow-y-auto scrollbar-hide min-h-0 pt-[112px]">
          <div className="max-w-full mx-auto space-y-4">
            {filteredMessages.map((message) => (
              <ChatMessage key={message.id} {...message} onLoginClick={onLoginClick} />
            ))}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex items-center gap-2">
                  <img 
                    src={sparklesImage} 
                    alt="Thinking" 
                    className="w-4 h-4 animate-buffering"
                  />
                  <span 
                    className="animate-buffering"
                    style={{
                      fontFamily: 'Figtree, system-ui, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      color: '#D4D4D8'
                    }}
                  >
                    Thinking...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="bg-white m-4 rounded-3xl shadow-sm">
          <div className="flex flex-col gap-4">
            {/* Search container with border */}
            <div className="border border-[#E4E4E7] rounded-3xl ">
              <div className="flex flex-col gap-4">
                {/* Input field - full width on its own row */}
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyPress={onKeyPress}
                  placeholder="Describe your requirement..."
                  className="w-full font-light !text-base bg-transparent border-0 rounded-lg px-4 py-4 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-0 min-h-[60px]"
                  disabled={isLoading}
                  style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
                />
                
                {/* Suggested buttons and send button on same row */}
                <div className="flex border-[#E4E4E7] border rounded-3xl bg-[#F4F4F5] items-end gap-3 p-2 justify-between">
                  {/* AI-suggested skill filter buttons */}
                  {suggestedSkills.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide relative flex-1">
                      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
                      {suggestedSkills.map((skill) => (
                        <SuggestedSkillButton
                          key={skill}
                          skill={skill}
                          isSelected={selectedSkillFilters.includes(skill)}
                          isLoading={isLoading}
                          onClick={() => onSkillFilterToggle(skill)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}
                  
                  {/* Send button */}
                  <TezzeractSendButton
                    onClick={onSendMessage}
                    disabled={!input.trim() || isLoading}
                    iconSize={20}
                  />
                </div>
              </div>
          
            </div>
            
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white h-full justify-center rounded-3xl p-8 relative">
      {/* Top bar with login button */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
        <img src={TezzeractTextLogo} alt="Tezzeract logo" className="h-4" />
        {!user && onLoginClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onLoginClick}
            className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Log in
          </Button>
        )}
      </div>
      <h1 className="text-gray-900 text-center text-5xl font-light mb-8">
        Start exploring talent,
        <br /> form your team & start growing!
      </h1>

      <div className="w-full max-w-2xl mx-auto p-6 rounded-3xl border border-gray-200 bg-white shadow-md">
        <div className="w-full">
          <div className="flex flex-col gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder="Start searching your dream team...."
              className="bg-gray-50 text-gray-900 placeholder-gray-400 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
              style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
            />
            <div className="flex flex-row p-2 rounded-lg gap-2">
              <Button
                disabled={!input.trim() || isLoading}
                variant="outline"
                className="rounded-xl w-10 h-10 p-0"
              >
                <Settings2 className="w-5 h-5" />
              </Button>

              <Button
                onClick={onSendMessage}
                disabled={!input.trim() || isLoading}
                className="rounded-xl w-10 h-10 p-0 ml-auto bg-gradient-to-br from-blue-800 to-blue-400 text-white hover:opacity-90"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
