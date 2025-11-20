import axios, { AxiosInstance } from 'axios';
import { createAuthenticatedAxios, getSupabaseToken } from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create a simple axios instance for public routes (no auth required)
const createPublicAxios = (): AxiosInstance => {
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Create authenticated axios instance for protected routes
const createAuthAxios = (): AxiosInstance => {
  return createAuthenticatedAxios(getSupabaseToken);
};

export interface DashboardMetrics {
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  conversions: number;
  followers: number;
}

export interface PlatformMetrics {
  platform: string;
  metrics: DashboardMetrics;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ChartDataPoint {
  date: string;
  impressions: number;
  engagement: number;
  clicks: number;
}

export interface DashboardAnalytics {
  metrics: DashboardMetrics;
  platformMetrics: PlatformMetrics[];
  chartData: ChartDataPoint[];
  timeRange: string;
}

export interface AIInsights {
  summary: string;
  recommendations: string[];
  performance: {
    bestPerforming: string;
    needsImprovement: string;
  };
}

export interface Platform {
  id: string;
  name: string;
  connected: boolean;
  lastSync: string | null;
  propertyName?: string | null;
}

export interface GoogleAnalyticsProperty {
  id: string;
  name: string;
  accountId: string;
}

export interface ScheduledPost {
  id: string;
  platform: string;
  content: string;
  scheduledFor: Date | string;
  status: 'scheduled' | 'published' | 'failed';
  contentType?: string;
  engagementScore?: number;
}

export interface ContentSuggestion {
  id: string;
  platform: string;
  content: string;
  type: string;
  engagement_score: number;
  suggestedDate?: string; // ISO date string
}

export interface Objective {
  id: string;
  user_id: string;
  objective_type: string;
  description: string;
  target_impressions: number;
  target_reach: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to use social media service
 * Uses authenticated API for platform management, public API for dashboard (if needed)
 */
export const useSocialService = () => {
  // Use public API for dashboard (if it doesn't require auth)
  const publicApi = createPublicAxios();
  // Use authenticated API for platform management
  const authApi = createAuthAxios();

  const getDashboardAnalytics = async (timeRange: string = '30d'): Promise<DashboardAnalytics> => {
    try {
      const response = await authApi.get(`/social/dashboard/analytics?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      throw error;
    }
  };

  const getAIInsights = async (timeRange: string = '30d'): Promise<AIInsights> => {
    try {
      const response = await authApi.get(`/social/dashboard/insights?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      throw error;
    }
  };

  const getConnectedPlatforms = async (): Promise<{ platforms: Platform[] }> => {
    try {
      const response = await authApi.get('/social/platforms');
      return response.data;
    } catch (error) {
      console.error('Error fetching connected platforms:', error);
      throw error;
    }
  };

  const connectPlatform = async (platform: string): Promise<{ authUrl: string }> => {
    try {
      const response = await authApi.post(`/social/platforms/${platform}/connect`);
      return response.data;
    } catch (error) {
      console.error('Error connecting platform:', error);
      throw error;
    }
  };

  const disconnectPlatform = async (platform: string): Promise<void> => {
    try {
      await authApi.delete(`/social/platforms/${platform}/disconnect`);
    } catch (error) {
      console.error('Error disconnecting platform:', error);
      throw error;
    }
  };

  const getContentCalendar = async (month?: number, year?: number): Promise<{ posts: ScheduledPost[] }> => {
    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      
      const response = await authApi.get(`/social/content/calendar?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching content calendar:', error);
      throw error;
    }
  };

  const schedulePost = async (
    platform: string,
    content: string,
    scheduledFor: Date,
    contentType?: string,
    engagementScore?: number
  ): Promise<{ post: ScheduledPost }> => {
    try {
      const response = await authApi.post('/social/content/schedule', {
        platform,
        content,
        scheduledFor: scheduledFor.toISOString(),
        contentType,
        engagementScore,
      });
      return response.data;
    } catch (error) {
      console.error('Error scheduling post:', error);
      throw error;
    }
  };

  const updateScheduledPost = async (
    id: string,
    platform: string,
    content: string,
    scheduledFor: Date,
    contentType?: string,
    engagementScore?: number
  ): Promise<{ post: ScheduledPost }> => {
    try {
      const response = await authApi.put(`/social/content/schedule/${id}`, {
        platform,
        content,
        scheduledFor: scheduledFor.toISOString(),
        contentType,
        engagementScore,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating scheduled post:', error);
      throw error;
    }
  };

  const deleteScheduledPost = async (id: string): Promise<void> => {
    try {
      await authApi.delete(`/social/content/schedule/${id}`);
    } catch (error) {
      console.error('Error deleting scheduled post:', error);
      throw error;
    }
  };

  const getContentSuggestions = async (regenerate: boolean = false): Promise<{ suggestions: ContentSuggestion[] }> => {
    try {
      const params = regenerate ? '?regenerate=true' : '';
      const response = await authApi.get(`/social/content/suggestions${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching content suggestions:', error);
      throw error;
    }
  };

  const getGoogleAnalyticsProperties = async (): Promise<{ properties: GoogleAnalyticsProperty[] }> => {
    try {
      const response = await authApi.get('/social/platforms/google_analytics/properties');
      return response.data;
    } catch (error) {
      console.error('Error fetching Google Analytics properties:', error);
      throw error;
    }
  };

  const selectGoogleAnalyticsProperty = async (propertyId: string, propertyName: string): Promise<void> => {
    try {
      await authApi.post('/social/platforms/google_analytics/properties/select', {
        propertyId,
        propertyName,
      });
    } catch (error) {
      console.error('Error selecting Google Analytics property:', error);
      throw error;
    }
  };

  const getObjectives = async (): Promise<{ objectives: Objective[] }> => {
    try {
      const response = await authApi.get('/social/objectives');
      return response.data;
    } catch (error) {
      console.error('Error fetching objectives:', error);
      throw error;
    }
  };

  const createObjective = async (
    objective: Omit<Objective, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<{ objective: Objective }> => {
    try {
      const response = await authApi.post('/social/objectives', objective);
      return response.data;
    } catch (error) {
      console.error('Error creating objective:', error);
      throw error;
    }
  };

  const deleteObjective = async (id: string): Promise<void> => {
    try {
      await authApi.delete(`/social/objectives/${id}`);
    } catch (error) {
      console.error('Error deleting objective:', error);
      throw error;
    }
  };

  return {
    getDashboardAnalytics,
    getAIInsights,
    getConnectedPlatforms,
    connectPlatform,
    disconnectPlatform,
    getContentCalendar,
    schedulePost,
    updateScheduledPost,
    deleteScheduledPost,
    getContentSuggestions,
    getGoogleAnalyticsProperties,
    selectGoogleAnalyticsProperty,
    getObjectives,
    createObjective,
    deleteObjective,
  };
};

