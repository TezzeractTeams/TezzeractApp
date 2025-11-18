// Token management utilities for OAuth tokens
// These tokens are stored in localStorage with expiration handling

interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  platform: string;
}

const TOKEN_PREFIX = 'tezzeract_token_';

/**
 * Store OAuth tokens in localStorage
 */
export function storeToken(platform: string, tokenData: Omit<TokenData, 'platform'>): void {
  const data: TokenData = {
    ...tokenData,
    platform,
  };
  
  try {
    localStorage.setItem(`${TOKEN_PREFIX}${platform}`, JSON.stringify(data));
    console.log(`[TokenManager] Stored token for ${platform}`);
  } catch (error) {
    console.error(`[TokenManager] Failed to store token for ${platform}:`, error);
  }
}

/**
 * Retrieve OAuth tokens from localStorage
 */
export function getToken(platform: string): TokenData | null {
  try {
    const stored = localStorage.getItem(`${TOKEN_PREFIX}${platform}`);
    if (!stored) return null;
    
    const data: TokenData = JSON.parse(stored);
    
    // Check if token is expired
    if (Date.now() >= data.expires_at) {
      console.log(`[TokenManager] Token for ${platform} has expired`);
      removeToken(platform);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`[TokenManager] Failed to retrieve token for ${platform}:`, error);
    return null;
  }
}

/**
 * Remove OAuth tokens from localStorage
 */
export function removeToken(platform: string): void {
  try {
    localStorage.removeItem(`${TOKEN_PREFIX}${platform}`);
    console.log(`[TokenManager] Removed token for ${platform}`);
  } catch (error) {
    console.error(`[TokenManager] Failed to remove token for ${platform}:`, error);
  }
}

/**
 * Check if a platform has valid tokens
 */
export function hasValidToken(platform: string): boolean {
  const token = getToken(platform);
  return token !== null;
}

/**
 * Clean up all expired tokens
 */
export function cleanupExpiredTokens(): void {
  try {
    const platforms = ['twitter', 'facebook', 'instagram', 'youtube', 'linkedin', 'google_analytics'];
    
    platforms.forEach(platform => {
      const token = getToken(platform);
      if (token === null) {
        // Token was expired and already removed by getToken
        console.log(`[TokenManager] Cleaned up expired token for ${platform}`);
      }
    });
  } catch (error) {
    console.error('[TokenManager] Error during token cleanup:', error);
  }
}

/**
 * Handle authentication errors (expired or invalid tokens)
 */
export function handleAuthError(platform: string): void {
  console.log(`[TokenManager] Handling auth error for ${platform}`);
  removeToken(platform);
  // You can trigger a re-authentication flow here if needed
}

/**
 * Get all connected platforms
 */
export function getConnectedPlatforms(): string[] {
  const platforms = ['twitter', 'facebook', 'instagram', 'youtube', 'linkedin', 'google_analytics'];
  return platforms.filter(platform => hasValidToken(platform));
}

