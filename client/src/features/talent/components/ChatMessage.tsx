import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
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
