import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const PORT = process.env.PORT || '5001';
const API_URL = process.env.API_URL || `http://localhost:${PORT}/api`;

// Store OAuth states temporarily (in production, use Redis or database)
const oauthStates = new Map<string, { userId: string; platform: string; expiresAt: number; codeVerifier?: string }>();

// Clean up expired states every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStates.entries()) {
    if (data.expiresAt < now) {
      oauthStates.delete(state);
    }
  }
}, 10 * 60 * 1000);

export function generateOAuthState(userId: string, platform: string, codeVerifier?: string): string {
  const state = crypto.randomBytes(32).toString('hex');
  oauthStates.set(state, {
    userId,
    platform,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    codeVerifier,
  });
  return state;
}

export function validateOAuthState(state: string): { userId: string; platform: string; codeVerifier?: string } | null {
  const data = oauthStates.get(state);
  if (!data || data.expiresAt < Date.now()) {
    oauthStates.delete(state);
    return null;
  }
  const result = { userId: data.userId, platform: data.platform, codeVerifier: data.codeVerifier };
  oauthStates.delete(state);
  return result;
}

// Google OAuth (for Google Analytics and YouTube)
export function getGoogleOAuthUrl(userId: string, platform: 'google_analytics' | 'youtube'): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }

  const state = generateOAuthState(userId, platform);
  const redirectUri = `${API_URL}/social/oauth/google/callback`;
  
  // Scopes based on platform
  const scopes = platform === 'google_analytics' 
    ? 'https://www.googleapis.com/auth/analytics.readonly'
    : 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Meta/Facebook OAuth
export function getMetaOAuthUrl(userId: string): string {
  const appId = process.env.META_APP_ID;
  if (!appId) {
    throw new Error('META_APP_ID is not configured');
  }

  const state = generateOAuthState(userId, 'meta');
  const redirectUri = `${API_URL}/social/oauth/meta/callback`;

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: 'pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,business_management',
    response_type: 'code',
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

// Twitter/X OAuth 2.0
export function getTwitterOAuthUrl(userId: string): string {
  const clientId = process.env.TWITTER_CLIENT_ID;
  if (!clientId) {
    throw new Error('TWITTER_CLIENT_ID is not configured');
  }

  // Generate code_verifier for PKCE (43-128 characters, URL-safe)
  // For 'plain' method, code_challenge equals code_verifier
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = codeVerifier; // For 'plain' method, they're the same

  const state = generateOAuthState(userId, 'twitter', codeVerifier);
  const redirectUri = `${API_URL}/social/oauth/twitter/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'tweet.read tweet.write users.read offline.access',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'plain',
  });

  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}

// Exchange authorization code for access token - Google
export async function exchangeGoogleCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${API_URL}/social/oauth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google token exchange failed: ${error}`);
  }

  return await response.json() as { access_token: string; refresh_token?: string; expires_in: number };
}

// Exchange authorization code for access token - Meta
export async function exchangeMetaCode(code: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = `${API_URL}/social/oauth/meta/callback`;

  if (!appId || !appSecret) {
    throw new Error('Meta OAuth credentials not configured');
  }

  const response = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Meta token exchange failed: ${error}`);
  }

  return await response.json() as { access_token: string; expires_in: number };
}

// Exchange authorization code for access token - Twitter
export async function exchangeTwitterCode(code: string, codeVerifier: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  const redirectUri = `${API_URL}/social/oauth/twitter/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Twitter OAuth credentials not configured');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twitter token exchange failed: ${error}`);
  }

  return await response.json() as { access_token: string; refresh_token?: string; expires_in: number };
}

