import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';

// Mock data
const mockChannels = [
  { id: '1', name: 'general', unread: 3, members: 12 },
  { id: '2', name: 'development', unread: 0, members: 8 },
  { id: '3', name: 'marketing', unread: 7, members: 6 },
  { id: '4', name: 'design', unread: 0, members: 5 },
];

const mockMessages = [
  { id: '1', userId: '2', userName: 'John Doe', message: 'Hey team! How is everyone doing?', timestamp: '2024-01-15T10:30:00Z' },
  { id: '2', userId: '3', userName: 'Jane Smith', message: 'Great! Just finished the new feature.', timestamp: '2024-01-15T10:32:00Z' },
  { id: '3', userId: '4', userName: 'Mike Johnson', message: 'Awesome work! Can\'t wait to test it.', timestamp: '2024-01-15T10:35:00Z' },
];

export const getChannels = async (req: AuthRequest, res: Response) => {
  try {
    // In production, fetch from database
    res.json({
      channels: mockChannels,
    });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { channelId } = req.params;
    
    // In production, fetch from database
    res.json({
      channelId,
      messages: mockMessages,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

