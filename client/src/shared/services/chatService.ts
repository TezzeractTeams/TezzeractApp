import axios from 'axios';
import type { Talent } from './talentService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export interface ChatMessagePayload {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatAIResponse {
  content: string;
  talents: Talent[];
  skills?: string[];
}

export const sendTalentChat = async (
  messages: ChatMessagePayload[]
): Promise<ChatAIResponse> => {
  try {
    const response = await axios.post(`${API_URL}/ai/chat`, { messages });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};


