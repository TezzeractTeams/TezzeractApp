import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "organization_form" | "company_size" | "login_button";
  talents?: any[];
  timestamp: Date;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: "1",
  role: "assistant",
  content: "Hello! I'm your AI talent recruiter. Tell me about your project and I'll help you find the perfect team members. What are you looking to build?",
  timestamp: new Date(),
};

interface ChatStore {
  messages: ChatMessage[];
  input: string;
  isResponding: boolean;
  suggestedSkills: string[];
  selectedSkillFilters: string[];
  recommendedTalents: any[];
  
  // Actions
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setInput: (input: string) => void;
  setIsResponding: (isResponding: boolean) => void;
  setSuggestedSkills: (skills: string[]) => void;
  setSelectedSkillFilters: (filters: string[]) => void;
  setRecommendedTalents: (talents: any[]) => void;
  toggleSkillFilter: (skill: string) => void;
  clearMessages: () => void;
  clearAll: () => void; // Clear all chat state including messages, skills, talents, etc.
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [INITIAL_MESSAGE],
      input: '',
      isResponding: false,
      suggestedSkills: [],
      selectedSkillFilters: [],
      recommendedTalents: [],
      
      setMessages: (messages) => {
        // Ensure timestamps are Date objects
        const normalizedMessages = messages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
        }));
        set({ messages: normalizedMessages });
      },
      
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, {
          ...message,
          timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp),
        }],
      })),
      
      setInput: (input) => set({ input }),
      
      setIsResponding: (isResponding) => set({ isResponding }),
      
      setSuggestedSkills: (skills) => set({ suggestedSkills: skills }),
      
      setSelectedSkillFilters: (filters) => set({ selectedSkillFilters: filters }),
      
      setRecommendedTalents: (talents) => set({ recommendedTalents: talents }),
      
      toggleSkillFilter: (skill) => set((state) => {
        const filters = state.selectedSkillFilters.includes(skill)
          ? state.selectedSkillFilters.filter((s) => s !== skill)
          : [...state.selectedSkillFilters, skill];
        return { selectedSkillFilters: filters };
      }),
      
      clearMessages: () => set({ messages: [INITIAL_MESSAGE] }),
      
      clearAll: () => set({
        messages: [INITIAL_MESSAGE],
        input: '',
        isResponding: false,
        suggestedSkills: [],
        selectedSkillFilters: [],
        recommendedTalents: [],
      }),
    }),
    {
      name: 'tezzeract-chat-store',
      partialize: (state) => ({
        messages: state.messages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
        })),
      }),
    }
  )
);

// Helper hook to ensure messages have Date objects
export const useChatStoreHydrated = () => {
  const store = useChatStore();
  
  // Convert timestamp strings back to Date objects on read
  const messages = store.messages.map((msg) => ({
    ...msg,
    timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp as any),
  }));
  
  return {
    ...store,
    messages,
  };
};

