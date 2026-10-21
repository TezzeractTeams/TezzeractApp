import axios, { AxiosInstance } from 'axios';
import { supabase } from './supabase';
import { handleUnauthorized } from './authSession';

// Default to same-origin `/api` so HttpOnly OIDC cookies work via the Vite proxy in dev.
const API_URL = import.meta.env.VITE_API_URL || '/api';

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
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // OIDC session uses HttpOnly cookies; attach Supabase Bearer only when present.
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
        // Same handler for every API caller: redirect to /auth/login.
        handleUnauthorized();
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

