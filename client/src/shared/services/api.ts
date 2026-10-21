import axios, { AxiosInstance } from 'axios';
import { supabase } from '../lib/supabase';
import { handleUnauthorized } from '../lib/authSession';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create base axios instance
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Factory function to create authenticated axios instance
export const createAuthenticatedApi = (getToken: () => Promise<string | null>): AxiosInstance => {
  const authenticatedApi = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add request interceptor to include auth token
  authenticatedApi.interceptors.request.use(
    async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor for error handling
  authenticatedApi.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Same handler for every API caller: redirect to /auth/login.
        handleUnauthorized();
      }
      return Promise.reject(error);
    }
  );

  return authenticatedApi;
};

/**
 * Get Supabase access token for API calls
 */
export const getSupabaseToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
};

