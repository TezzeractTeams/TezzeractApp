import { Request, Response, NextFunction } from 'express';
import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

// Extend Express Request type to include auth
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
        [key: string]: any;
      };
    }
  }
}

// Check if Clerk is configured
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const isClerkConfigured = !!CLERK_SECRET_KEY;

if (!isClerkConfigured) {
  console.warn('⚠️  WARNING: CLERK_SECRET_KEY not found in environment variables');
  console.warn('⚠️  Authentication will be disabled. Add CLERK_SECRET_KEY to enable auth.');
}

// Middleware that requires authentication (blocks if not authenticated)
export const requireAuth = isClerkConfigured 
  ? ClerkExpressRequireAuth()
  : (req: Request, res: Response, next: NextFunction) => {
      console.warn('[Auth] requireAuth bypassed - Clerk not configured');
      next();
    };

// Middleware that optionally checks for authentication (doesn't block)
export const optionalAuth = isClerkConfigured
  ? ClerkExpressWithAuth()
  : (req: Request, res: Response, next: NextFunction) => {
      // Skip auth check if Clerk is not configured
      next();
    };

// Optional: Custom middleware to extract and log user info
export const extractUserInfo = (req: Request, res: Response, next: NextFunction) => {
  if (req.auth?.userId) {
    console.log('[Auth] Authenticated user:', req.auth.userId);
  }
  next();
};
