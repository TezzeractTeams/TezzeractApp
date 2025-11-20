import axios, { AxiosInstance } from 'axios';
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/**
 * Create an axios instance with authentication
 * @param getToken Function to get the auth token from Supabase
 * @returns Configured axios instance
 */
export const createAuthenticatedAxios = (
  getToken: () => Promise<string | null>
): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add auth token to all requests
  instance.interceptors.request.use(
    async (config) => {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Handle auth errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid - redirect to login
        console.error('Authentication error:', error.response.data);
        window.location.href = '/';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * Get Supabase access token
 */
export const getSupabaseToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
};

