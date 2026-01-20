import { createAuthenticatedApi, getSupabaseToken } from './api';

const api = createAuthenticatedApi(getSupabaseToken);

export interface BookMeetingRequest {
  start: string; // ISO 8601 format
  attendee: {
    name: string;
    email: string;
    timeZone: string;
    phoneNumber?: string;
    language?: string;
  };
  eventTypeId?: number;
  eventTypeSlug?: string;
  username?: string;
  guests?: string[];
  metadata?: Record<string, any>;
  lengthInMinutes?: number;
}

export interface BookMeetingResponse {
  message: string;
  booking: any;
}

/**
 * Book a meeting using Cal.com
 */
export const bookMeeting = async (request: BookMeetingRequest): Promise<BookMeetingResponse> => {
  try {
    const response = await api.post('/meeting/book', request);
    return response.data;
  } catch (error: any) {
    console.error('Error booking meeting:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication required');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data.error || 'Invalid meeting request');
    }
    throw error;
  }
};
