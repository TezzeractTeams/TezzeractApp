import { api } from './api';

export interface Talent {
  id: string;
  name: string;
  skills: string[];
  experience_years: number;
  availability: boolean;
  image_url: string;
  created_at?: string;
  updated_at?: string;
}

export interface TalentsResponse {
  talents: Talent[];
  total: number;
}

export interface SearchParams {
  search?: string;
  skills?: string;
  availability?: boolean;
  minExperience?: number;
  maxExperience?: number;
}

// Get all talents with optional filters (public endpoint)
export const getTalents = async (params?: SearchParams): Promise<TalentsResponse> => {
  try {
    const response = await api.get('/talent/talents', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching talents:', error);
    throw error;
  }
};

// Get a single talent by ID (public endpoint)
export const getTalentById = async (id: string): Promise<Talent> => {
  try {
    const response = await api.get(`/talent/talents/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching talent:', error);
    throw error;
  }
};

// Create a new talent (requires auth - token will be added in component via useAuth)
export const createTalent = async (talent: Omit<Talent, 'id' | 'created_at' | 'updated_at'>, token?: string): Promise<Talent> => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.post('/talent/talents', talent, { headers });
    return response.data;
  } catch (error) {
    console.error('Error creating talent:', error);
    throw error;
  }
};

// Update a talent (requires auth)
export const updateTalent = async (id: string, updates: Partial<Talent>, token?: string): Promise<Talent> => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.put(`/talent/talents/${id}`, updates, { headers });
    return response.data;
  } catch (error) {
    console.error('Error updating talent:', error);
    throw error;
  }
};

// Delete a talent (requires auth)
export const deleteTalent = async (id: string, token?: string): Promise<void> => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    await api.delete(`/talent/talents/${id}`, { headers });
  } catch (error) {
    console.error('Error deleting talent:', error);
    throw error;
  }
};

