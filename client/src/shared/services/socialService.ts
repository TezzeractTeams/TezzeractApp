import axios, { AxiosInstance } from 'axios';

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
}

export interface ScheduledPost {
  id: string;
  platform: string;
  content: string;
  scheduledFor: Date;
  status: 'scheduled' | 'published' | 'failed';
}

export interface ContentSuggestion {
  id: string;
  platform: string;
  content: string;
  type: string;
  engagement_score: number;
}

/**
 * Hook to use social media service (public routes - no auth required)
 * For public dashboard routes, we use a simple axios instance without authentication
 */
export const useSocialService = () => {
  // Use public API (no auth required for dashboard)
  const api = createPublicAxios();

  const getDashboardAnalytics = async (timeRange: string = '30d'): Promise<DashboardAnalytics> => {
    try {
      const response = await api.get(`/social/dashboard/analytics?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      throw error;
    }
  };

  const getAIInsights = async (timeRange: string = '30d'): Promise<AIInsights> => {
    try {
      const response = await api.get(`/social/dashboard/insights?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      throw error;
    }
  };

  const getConnectedPlatforms = async (): Promise<{ platforms: Platform[] }> => {
    try {
      const response = await api.get('/social/platforms');
      return response.data;
    } catch (error) {
      console.error('Error fetching connected platforms:', error);
      throw error;
    }
  };

  const connectPlatform = async (platform: string): Promise<{ authUrl: string }> => {
    try {
      const response = await api.post(`/social/platforms/${platform}/connect`);
      return response.data;
    } catch (error) {
      console.error('Error connecting platform:', error);
      throw error;
    }
  };

  const disconnectPlatform = async (platform: string): Promise<void> => {
    try {
      await api.delete(`/social/platforms/${platform}/disconnect`);
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
      
      const response = await api.get(`/social/content/calendar?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching content calendar:', error);
      throw error;
    }
  };

  const schedulePost = async (
    platform: string,
    content: string,
    scheduledFor: Date
  ): Promise<{ post: ScheduledPost }> => {
    try {
      const response = await api.post('/social/content/schedule', {
        platform,
        content,
        scheduledFor,
      });
      return response.data;
    } catch (error) {
      console.error('Error scheduling post:', error);
      throw error;
    }
  };

  const getContentSuggestions = async (): Promise<{ suggestions: ContentSuggestion[] }> => {
    try {
      const response = await api.get('/social/content/suggestions');
      return response.data;
    } catch (error) {
      console.error('Error fetching content suggestions:', error);
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
    getContentSuggestions,
  };
};

