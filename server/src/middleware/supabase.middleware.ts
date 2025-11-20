import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Extend Express Request type to include auth
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email?: string;
        [key: string]: any;
      };
    }
  }
}

// Lazy initialization to ensure dotenv.config() has run
let supabaseClient: ReturnType<typeof createClient> | null = null;

const getSupabaseClient = () => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('⚠️  WARNING: SUPABASE_URL or SUPABASE_ANON_KEY not found in environment variables');
      console.warn('⚠️  Authentication will be disabled. Add Supabase credentials to enable auth.');
      return null;
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
};

/**
 * Middleware that requires authentication (blocks if not authenticated)
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('[Auth] requireAuth bypassed - Supabase not configured');
    return res.status(401).json({ error: 'Authentication required but not configured' });
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user info to request
    req.auth = {
      userId: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error('[Auth] Error verifying token:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware that optionally checks for authentication (doesn't block)
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (!error && user) {
        req.auth = {
          userId: user.id,
          email: user.email,
        };
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    console.warn('[Auth] Optional auth check failed:', error);
  }

  next();
};

/**
 * Optional: Custom middleware to extract and log user info
 */
export const extractUserInfo = (req: Request, res: Response, next: NextFunction) => {
  if (req.auth?.userId) {
    console.log('[Auth] Authenticated user:', req.auth.userId);
  }
  next();
};

