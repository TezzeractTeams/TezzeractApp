import { useRef, useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { ChatMessage } from "./ChatMessage";
import { Send, Loader2, Plus, Settings2, ArrowRight } from "lucide-react";

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

interface ChatPanelProps {
  messages: Message[];
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onShowAddTalentForm: () => void;
  hasUserMessage: boolean;
}

export function ChatPanel({
  messages,
  input,
  isLoading,
  onInputChange,
  onSendMessage,
  onKeyPress,
  onShowAddTalentForm,
  hasUserMessage,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

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

  if (hasUserMessage) {
    return (
      <div className="flex flex-col h-full p-4 bg-white transition-all duration-300 ease-in-out rounded-3xl">
        {/* Logo at top left */}
        <div className="pb-2 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-800 to-blue-400 flex items-center justify-center text-white font-bold">
            T
          </div>
          <span className="font-semibold text-gray-900">TezzTalent</span>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="max-w-full mx-auto space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} {...message} />
            ))}
            {isLoading && (
              <div className="flex gap-3 p-4 animate-fade-in">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-800 to-blue-400 text-white">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 text-gray-900 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      TezzTalent is searching for top talents...
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm">
          <div className="flex flex-col gap-4">
            {/* Search container with border */}
            <div className="border border-blue-200 rounded-3xl p-4">
              <div className="flex flex-col gap-4">
                {/* Search bar and send button */}
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => onInputChange(e.target.value)}
                    onKeyPress={onKeyPress}
                    placeholder="Describe your requirement..."
                    className="flex-1 font-light !text-base bg-transparent border-0 rounded-lg px-4 py-4 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-0 h-12"
                  />
                  <Button
                    onClick={onSendMessage}
                    disabled={!input.trim() || isLoading}
                    className="rounded-2xl px-4 py-6 h-12 text-white hover:opacity-90 transition-all duration-200 bg-gradient-to-br from-blue-800 to-blue-400"
                  >
                    <ArrowRight className="w-6 h-6" />
                  </Button>
                </div>
                
                {/* Filter buttons inside the container */}
                <div className="flex gap-3 overflow-x-auto relative">
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
                  <Button
                    onClick={() => setSelectedFilter(selectedFilter === 'MVP' ? null : 'MVP')}
                    disabled={isLoading}
                    className={`rounded-full px-6 py-2 font-medium transition-all duration-200 whitespace-nowrap ${
                      selectedFilter === 'MVP'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-600 border border-blue-400 hover:bg-blue-500 hover:text-white'
                    }`}
                  >
                    MVP
                  </Button>
                  <Button
                    onClick={() => setSelectedFilter(selectedFilter === 'AI Automation' ? null : 'AI Automation')}
                    className={`rounded-full px-6 py-2 font-medium transition-all duration-200 whitespace-nowrap ${
                      selectedFilter === 'AI Automation'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-600 border border-blue-400 hover:bg-blue-500 hover:text-white'
                    }`}
                  >
                    AI Automation
                  </Button>
                  <Button
                    onClick={() => setSelectedFilter(selectedFilter === 'Development' ? null : 'Development')}
                    className={`rounded-full px-6 py-2 font-medium transition-all duration-200 whitespace-nowrap ${
                      selectedFilter === 'Development'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-600 border border-blue-400 hover:bg-blue-500 hover:text-white'
                    }`}
                  >
                    Development
                  </Button>
                  <Button
                    onClick={() => setSelectedFilter(selectedFilter === 'Design' ? null : 'Design')}
                    className={`rounded-full px-6 py-2 font-medium transition-all duration-200 whitespace-nowrap ${
                      selectedFilter === 'Design'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-600 border border-blue-400 hover:bg-blue-500 hover:text-white'
                    }`}
                  >
                    Design
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white h-full justify-center rounded-3xl p-8">
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
            />
            <div className="flex flex-row p-2 rounded-lg gap-2">
              <Button
                onClick={onShowAddTalentForm}
                disabled={isLoading}
                variant="outline"
                className="rounded-xl w-10 h-10 p-0"
              >
                <Plus className="w-5 h-5" />
              </Button>

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
