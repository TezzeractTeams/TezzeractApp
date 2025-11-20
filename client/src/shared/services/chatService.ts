import { createAuthenticatedAxios, getSupabaseToken } from '../lib/api';
import type { Talent } from './talentService';

export interface ChatMessagePayload {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatAIResponse {
  content: string;
  talents: Talent[];
  skills?: string[];
}

/**
 * Hook to use chat service with authentication
 */
export const useChatService = () => {
  const api = createAuthenticatedAxios(getSupabaseToken);

  const sendTalentChat = async (
    messages: ChatMessagePayload[]
  ): Promise<ChatAIResponse> => {
    try {
      const response = await api.post('/ai/chat', { messages });
      return response.data;
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  };

  return { sendTalentChat };
};


