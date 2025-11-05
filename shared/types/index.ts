// User types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Talent types
export interface Candidate {
  id: string;
  name: string;
  role: string;
  skills: string;
  status: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  status: string;
  applicants: number;
}

// Social types
export interface Platform {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
  followers: number;
  engagement: number;
}

export interface Analytics {
  totalReach: number;
  totalEngagement: number;
  totalFollowers: number;
  totalPosts: number;
  reachGrowth: number;
  engagementGrowth: number;
  followersGrowth: number;
  postsThisMonth: number;
}

// Chat types
export interface Channel {
  id: string;
  name: string;
  unread: number;
  members: number;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

