import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';

// Mock data
const mockPlatforms = [
  { id: '1', name: 'Twitter/X', status: 'connected', followers: 12500, engagement: 8.7 },
  { id: '2', name: 'Facebook', status: 'connected', followers: 23400, engagement: 6.2 },
  { id: '3', name: 'Instagram', status: 'connected', followers: 45200, engagement: 12.3 },
  { id: '4', name: 'LinkedIn', status: 'disconnected', followers: 0, engagement: 0 },
];

const mockAnalytics = {
  totalReach: 2400000,
  totalEngagement: 8.7,
  totalFollowers: 45200,
  totalPosts: 127,
  reachGrowth: 18,
  engagementGrowth: 2.3,
  followersGrowth: 1200,
  postsThisMonth: 23,
};

export const getPlatforms = async (req: AuthRequest, res: Response) => {
  try {
    // In production, fetch from database
    res.json({
      platforms: mockPlatforms,
    });
  } catch (error) {
    console.error('Get platforms error:', error);
    res.status(500).json({ error: 'Failed to fetch platforms' });
  }
};

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    // In production, fetch from database and external APIs
    res.json(mockAnalytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

