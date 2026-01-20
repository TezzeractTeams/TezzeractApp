import { createAuthenticatedAxios, getSupabaseToken } from '../lib/api';
import { api } from './api';
import type { Talent } from './talentService';

export interface ChatMessagePayload {
  role: 'user' | 'assistant';
  content: string;
}

export interface RecommendedTalent extends Talent {
  role?: string;
}

export interface ChatAIResponse {
  content: string;
  talents: Talent[];
  recommendedTalents?: RecommendedTalent[];
  roles?: string[];
  skills?: string[];
}

/**
 * Hook to use chat service - supports both authenticated and unauthenticated requests
 */
export const useChatService = () => {
  // Use base api instance for chat (doesn't redirect on 401)
  // Server endpoint uses optionalAuth, so it works with or without token
  const sendTalentChat = async (
    messages: ChatMessagePayload[]
  ): Promise<ChatAIResponse> => {
    try {
      // Try to get token if available, but don't require it
      const token = await getSupabaseToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await api.post('/ai/chat', { messages }, { headers });
      return response.data;
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  };

  // Swap talent still requires auth, so use authenticated client
  const swapTalent = async (
    talentId: string,
    role?: string,
    excludeIds?: string[]
  ): Promise<{ talent: Talent }> => {
    try {
      const authenticatedApi = createAuthenticatedAxios(getSupabaseToken);
      const response = await authenticatedApi.post('/ai/swap', {
        talentId,
        role,
        excludeIds,
      });
      return response.data;
    } catch (error) {
      console.error('Error swapping talent:', error);
      throw error;
    }
  };

  return { sendTalentChat, swapTalent };
};


