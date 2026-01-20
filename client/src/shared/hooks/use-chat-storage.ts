import { useState, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  talents?: any[];
  timestamp: Date;
}

const STORAGE_KEY = 'tezzeract_chat_messages';
const INITIAL_MESSAGE: ChatMessage = {
  id: "1",
  role: "assistant",
  content: "Hello! I'm your AI talent recruiter. Tell me about your project and I'll help you find the perfect team members. What are you looking to build?",
  timestamp: new Date(),
};

export function useChatStorage() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
      return [INITIAL_MESSAGE];
    } catch (error) {
      console.error('Failed to load chat messages from localStorage:', error);
      return [INITIAL_MESSAGE];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat messages to localStorage:', error);
    }
  }, [messages]);

  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const clearMessages = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  return { messages, setMessages, addMessage, clearMessages };
}





