import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';

// Mock data
const mockCandidates = [
  { id: '1', name: 'John Doe', role: 'Senior Developer', skills: 'React, Node.js, TypeScript', status: 'Active' },
  { id: '2', name: 'Jane Smith', role: 'Product Manager', skills: 'Agile, Scrum, Product Strategy', status: 'Active' },
  { id: '3', name: 'Mike Johnson', role: 'UX Designer', skills: 'Figma, User Research, Prototyping', status: 'Active' },
];

const mockJobs = [
  { id: '1', title: 'Senior React Developer', department: 'Engineering', status: 'Open', applicants: 23 },
  { id: '2', title: 'Product Manager', department: 'Product', status: 'Open', applicants: 15 },
  { id: '3', title: 'UX Designer', department: 'Design', status: 'Open', applicants: 31 },
];

export const getCandidates = async (req: AuthRequest, res: Response) => {
  try {
    // In production, fetch from database
    res.json({
      candidates: mockCandidates,
      total: mockCandidates.length,
    });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
};

export const getJobs = async (req: AuthRequest, res: Response) => {
  try {
    // In production, fetch from database
    res.json({
      jobs: mockJobs,
      total: mockJobs.length,
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

