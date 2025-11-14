import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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

// Get all talents with optional filters
export const getTalents = async (params?: SearchParams): Promise<TalentsResponse> => {
  try {
    const response = await axios.get(`${API_URL}/talent/talents`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching talents:', error);
    throw error;
  }
};

// Get a single talent by ID
export const getTalentById = async (id: string): Promise<Talent> => {
  try {
    const response = await axios.get(`${API_URL}/talent/talents/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching talent:', error);
    throw error;
  }
};

// Create a new talent
export const createTalent = async (talent: Omit<Talent, 'id' | 'created_at' | 'updated_at'>): Promise<Talent> => {
  try {
    const response = await axios.post(`${API_URL}/talent/talents`, talent);
    return response.data;
  } catch (error) {
    console.error('Error creating talent:', error);
    throw error;
  }
};

// Update a talent
export const updateTalent = async (id: string, updates: Partial<Talent>): Promise<Talent> => {
  try {
    const response = await axios.put(`${API_URL}/talent/talents/${id}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating talent:', error);
    throw error;
  }
};

// Delete a talent
export const deleteTalent = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/talent/talents/${id}`);
  } catch (error) {
    console.error('Error deleting talent:', error);
    throw error;
  }
};

