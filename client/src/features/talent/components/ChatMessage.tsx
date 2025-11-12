import { Bot, User } from "lucide-react";

interface Talent {
  id: string;
  image_url: string;
  name: string;
  skills: string[];
  experience_years: number;
  availability: boolean;
}

interface ChatMessageProps {
  id: string;
  role: "user" | "assistant";
  content: string;
  talents?: Talent[];
  timestamp: Date;
}

export function ChatMessage({ role, content, talents }: ChatMessageProps) {
  return (
    <div className={`flex gap-3 ${role === 'user' ? 'justify-end' : ''} animate-fade-in`}>
      {role === 'assistant' && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-800 to-blue-400 text-white">
          <Bot className="w-4 h-4" />
        </div>
      )}
      
      <div className={`flex-1 max-w-[80%] ${role === 'user' ? 'ml-auto' : ''}`}>
        <div
          className={`rounded-lg p-3 ${
            role === 'user'
              ? 'bg-gradient-to-br from-blue-800 to-blue-400 text-white'
              : 'bg-gray-100 text-gray-900 border border-gray-200'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{content}</p>
          
          {talents && talents.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs font-medium mb-2">
                Found {talents.length} matching talent{talents.length > 1 ? 's' : ''}:
              </p>
              <div className="space-y-1">
                {talents.slice(0, 3).map((talent) => (
                  <div key={talent.id} className="text-xs">
                    • {talent.name} - {talent.skills.slice(0, 2).join(', ')}
                  </div>
                ))}
                {talents.length > 3 && (
                  <div className="text-xs opacity-70">
                    ...and {talents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {role === 'user' && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-700">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
