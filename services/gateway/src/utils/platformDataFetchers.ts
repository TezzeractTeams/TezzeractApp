import { supabase } from '../config/supabase.js';

const TOKEN_REFRESH_BUFFER_MS = 60 * 1000;

interface PlatformConnection {
  id: string;
  access_token: string | null;
  refresh_token?: string | null;
  token_expires_at?: string | null;
  metadata?: Record<string, any> | null;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
}

interface TwitterTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

interface PlatformMetrics {
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  conversions: number;
  followers: number;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Calculate date range based on timeRange string
 */
export function getDateRange(timeRange: string): DateRange {
  const endDate = new Date();
  const startDate = new Date();

  switch (timeRange) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

/**
 * Refresh Google OAuth access token using the stored refresh token.
 */
async function refreshGoogleAccessToken(connection: PlatformConnection): Promise<string | null> {
  if (!connection.refresh_token) {
    console.warn('No refresh token found for Google Analytics connection', connection.id);
    return null;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Google OAuth credentials are not configured');
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.error('Failed to refresh Google access token:', await response.text());
      return null;
    }

    const tokens = (await response.json()) as GoogleTokenResponse;
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    const updatePayload: Record<string, any> = {
      access_token: tokens.access_token,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    };

    if (tokens.refresh_token) {
      updatePayload.refresh_token = tokens.refresh_token;
    }

    const { error } = await supabase
      .from('platform_connections')
      .update(updatePayload)
      .eq('id', connection.id);

    if (error) {
      console.error('Failed to persist refreshed Google token:', error);
    }

    connection.access_token = tokens.access_token;
    connection.token_expires_at = expiresAt;
    if (tokens.refresh_token) {
      connection.refresh_token = tokens.refresh_token;
    }

    return tokens.access_token;
  } catch (error) {
    console.error('Unexpected error refreshing Google access token:', error);
    return null;
  }
}

/**
 * Ensure the Google Analytics access token is valid, refreshing when needed.
 */
async function getValidGoogleAccessToken(connection: PlatformConnection): Promise<string | null> {
  if (!connection.access_token) {
    return connection.refresh_token ? refreshGoogleAccessToken(connection) : null;
  }

  if (!connection.token_expires_at) {
    return connection.access_token;
  }

  const expiresAt = new Date(connection.token_expires_at).getTime();
  if (Number.isNaN(expiresAt)) {
    return connection.access_token;
  }

  if (expiresAt - TOKEN_REFRESH_BUFFER_MS > Date.now()) {
    return connection.access_token;
  }

  return refreshGoogleAccessToken(connection);
}

/**
 * Refresh Twitter OAuth access token using the stored refresh token.
 */
async function refreshTwitterAccessToken(connection: PlatformConnection): Promise<string | null> {
  if (!connection.refresh_token) {
    console.warn('No refresh token found for Twitter connection', connection.id);
    return null;
  }

  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Twitter OAuth credentials are not configured');
    return null;
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refresh_token,
        client_id: clientId,
      }),
    });

    if (!response.ok) {
      console.error('Failed to refresh Twitter access token:', await response.text());
      return null;
    }

    const tokens = (await response.json()) as TwitterTokenResponse;
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    const updatePayload: Record<string, any> = {
      access_token: tokens.access_token,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    };

    if (tokens.refresh_token) {
      updatePayload.refresh_token = tokens.refresh_token;
    }

    const { error } = await supabase
      .from('platform_connections')
      .update(updatePayload)
      .eq('id', connection.id);

    if (error) {
      console.error('Failed to persist refreshed Twitter token:', error);
    }

    connection.access_token = tokens.access_token;
    connection.token_expires_at = expiresAt;
    if (tokens.refresh_token) {
      connection.refresh_token = tokens.refresh_token;
    }

    return tokens.access_token;
  } catch (error) {
    console.error('Unexpected error refreshing Twitter access token:', error);
    return null;
  }
}

/**
 * Ensure the Twitter access token is valid, refreshing when needed.
 */
async function getValidTwitterAccessToken(connection: PlatformConnection): Promise<string | null> {
  if (!connection.access_token) {
    return connection.refresh_token ? refreshTwitterAccessToken(connection) : null;
  }

  if (!connection.token_expires_at) {
    return connection.access_token;
  }

  const expiresAt = new Date(connection.token_expires_at).getTime();
  if (Number.isNaN(expiresAt)) {
    return connection.access_token;
  }

  if (expiresAt - TOKEN_REFRESH_BUFFER_MS > Date.now()) {
    return connection.access_token;
  }

  return refreshTwitterAccessToken(connection);
}

/**
 * Fetch Google Analytics data
 */
export async function fetchGoogleAnalyticsData(
  userId: string,
  timeRange: string
): Promise<PlatformMetrics | null> {
  try {
    const { data: connection } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform_id', 'google_analytics')
      .single();

    const gaConnection = connection as PlatformConnection | null;
    const propertyId = gaConnection?.metadata?.property_id as string | undefined;

    if (!gaConnection || !propertyId) {
      return null;
    }

    let accessToken = await getValidGoogleAccessToken(gaConnection);
    if (!accessToken) {
      console.warn('Unable to resolve Google Analytics access token for user', userId);
      return null;
    }

    const { startDate, endDate } = getDateRange(timeRange);

    // Use Google Analytics Data API (GA4)
    // Property ID format: "properties/123456789" or just numeric ID
    const propertyIdFormatted = propertyId.startsWith('properties/') 
      ? propertyId 
      : `properties/${propertyId}`;
    
    const runReport = (token: string) =>
      fetch(
        `https://analyticsdata.googleapis.com/v1beta/${propertyIdFormatted}:runReport`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dateRanges: [{ startDate, endDate }],
            metrics: [
              { name: 'screenPageViews' }, // Impressions/Views
              { name: 'activeUsers' }, // Reach
              { name: 'eventCount' }, // Engagement
              { name: 'totalUsers' }, // Clicks (approximation)
            ],
          }),
        }
      );

    let response = await runReport(accessToken);

    if (response.status === 401) {
      console.warn('Google Analytics API returned 401. Attempting token refresh...');
      const refreshedToken = await refreshGoogleAccessToken(gaConnection);
      if (refreshedToken) {
        accessToken = refreshedToken;
        response = await runReport(accessToken);
      }
    }

    if (!response.ok) {
      console.error('GA API error:', await response.text());
      return null;
    }

    const data = await response.json() as { rows?: any[] };
    const rows = data.rows || [];
    
    if (rows.length === 0) {
      return null;
    }

    const metrics = rows[0].metricValues || [];
    
    return {
      impressions: parseInt(metrics[0]?.value || '0'),
      reach: parseInt(metrics[1]?.value || '0'),
      engagement: parseInt(metrics[2]?.value || '0'),
      clicks: parseInt(metrics[3]?.value || '0'),
      conversions: 0, // GA4 doesn't directly provide conversions in this format
      followers: 0, // Not applicable for GA
    };
  } catch (error) {
    console.error('Error fetching Google Analytics data:', error);
    return null;
  }
}

/**
 * Fetch YouTube Analytics data
 */
export async function fetchYouTubeData(
  userId: string,
  timeRange: string
): Promise<PlatformMetrics | null> {
  try {
    const { data: connection } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform_id', 'youtube')
      .single();

    if (!connection || !connection.access_token) {
      return null;
    }

    // First, get the channel ID
    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true',
      {
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
        },
      }
    );

    if (!channelResponse.ok) {
      return null;
    }

    const channelData = await channelResponse.json() as { items?: any[] };
    const channel = channelData.items?.[0];
    
    if (!channel) {
      return null;
    }

    const stats = channel.statistics || {};
    const { startDate, endDate } = getDateRange(timeRange);

    // Get analytics data for the date range
    // Note: YouTube Analytics API requires channel ID, not "MINE"
    const channelId = channel.id;
    const analyticsResponse = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=${startDate}&endDate=${endDate}&metrics=views,likes,comments,shares,subscribersGained`,
      {
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
        },
      }
    );

    let views = 0;
    let engagement = 0;
    
    if (analyticsResponse.ok) {
      const analyticsData = await analyticsResponse.json() as { rows?: any[] };
      const rows = analyticsData.rows || [];
      if (rows.length > 0) {
        views = rows[0][0] || 0; // views
        const likes = rows[0][1] || 0;
        const comments = rows[0][2] || 0;
        const shares = rows[0][3] || 0;
        engagement = likes + comments + shares;
      }
    }

    return {
      impressions: views,
      reach: views, // YouTube doesn't have separate reach metric
      engagement: engagement,
      clicks: 0, // Not directly available
      conversions: 0,
      followers: parseInt(stats.subscriberCount || '0'),
    };
  } catch (error) {
    console.error('Error fetching YouTube data:', error);
    return null;
  }
}

/**
 * Fetch Meta/Facebook data
 */
export async function fetchMetaData(
  userId: string,
  timeRange: string
): Promise<PlatformMetrics | null> {
  try {
    const { data: connection } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform_id', 'meta')
      .single();

    if (!connection || !connection.access_token) {
      return null;
    }

    // Get user's pages
    const pagesResponse = await fetch(
      'https://graph.facebook.com/v18.0/me/accounts?access_token=' + connection.access_token
    );

    if (!pagesResponse.ok) {
      return null;
    }

    const pagesData = await pagesResponse.json() as { data?: any[] };
    const pages = pagesData.data || [];

    if (pages.length === 0) {
      return null;
    }

    // Aggregate data from all pages
    let totalImpressions = 0;
    let totalReach = 0;
    let totalEngagement = 0;
    let totalClicks = 0;
    let totalFollowers = 0;

    const { startDate, endDate } = getDateRange(timeRange);

    for (const page of pages) {
      // Get page insights
      const insightsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}/insights?metric=page_impressions,page_reach,page_engaged_users,page_clicks&since=${new Date(startDate).getTime() / 1000}&until=${new Date(endDate).getTime() / 1000}&access_token=${connection.access_token}`
      );

      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json() as { data?: any[] };
        const insights = insightsData.data || [];

        for (const insight of insights) {
          const value = parseInt(insight.values?.[0]?.value || '0');
          switch (insight.name) {
            case 'page_impressions':
              totalImpressions += value;
              break;
            case 'page_reach':
              totalReach += value;
              break;
            case 'page_engaged_users':
              totalEngagement += value;
              break;
            case 'page_clicks':
              totalClicks += value;
              break;
          }
        }
      }

      // Get page followers
      const pageInfoResponse = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}?fields=followers_count&access_token=${connection.access_token}`
      );

      if (pageInfoResponse.ok) {
        const pageInfo = await pageInfoResponse.json() as { followers_count?: string };
        totalFollowers += parseInt(pageInfo.followers_count || '0');
      }
    }

    return {
      impressions: totalImpressions,
      reach: totalReach,
      engagement: totalEngagement,
      clicks: totalClicks,
      conversions: 0,
      followers: totalFollowers,
    };
  } catch (error) {
    console.error('Error fetching Meta data:', error);
    return null;
  }
}

/**
 * Fetch Twitter/X data
 */
export async function fetchTwitterData(
  userId: string,
  timeRange: string
): Promise<PlatformMetrics | null> {
  try {
    const { data: connection } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform_id', 'twitter')
      .single();

    const twitterConnection = connection as PlatformConnection | null;
    if (!twitterConnection) {
      return null;
    }

    let accessToken = await getValidTwitterAccessToken(twitterConnection);
    if (!accessToken) {
      console.warn('Unable to resolve Twitter access token for user', userId);
      return null;
    }

    // Get user's Twitter account info
    const fetchUser = (token: string) =>
      fetch('https://api.twitter.com/2/users/me?user.fields=public_metrics', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

    let userResponse = await fetchUser(accessToken);

    if (userResponse.status === 401) {
      console.warn('Twitter API returned 401. Attempting token refresh...');
      const refreshedToken = await refreshTwitterAccessToken(twitterConnection);
      if (refreshedToken) {
        accessToken = refreshedToken;
        userResponse = await fetchUser(accessToken);
      }
    }

    if (!userResponse.ok) {
      return null;
    }

    const userData = await userResponse.json() as { data?: any };
    const user = userData.data;
    const metrics = user?.public_metrics || {};

    // Get tweets for the time range
    const { startDate, endDate } = getDateRange(timeRange);
    const fetchTweets = (token: string) =>
      fetch(
        `https://api.twitter.com/2/tweets/search/recent?query=from:${user.username}&start_time=${startDate}T00:00:00Z&end_time=${endDate}T23:59:59Z&tweet.fields=public_metrics&max_results=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

    let tweetsResponse = await fetchTweets(accessToken);

    if (tweetsResponse.status === 401) {
      const refreshedToken = await refreshTwitterAccessToken(twitterConnection);
      if (refreshedToken) {
        accessToken = refreshedToken;
        tweetsResponse = await fetchTweets(accessToken);
      }
    }

    let totalImpressions = 0;
    let totalEngagement = 0;

    if (tweetsResponse.ok) {
      const tweetsData = await tweetsResponse.json() as { data?: any[] };
      const tweets = tweetsData.data || [];

      for (const tweet of tweets) {
        const tweetMetrics = tweet.public_metrics || {};
        totalImpressions += tweetMetrics.impression_count || 0;
        totalEngagement +=
          (tweetMetrics.like_count || 0) +
          (tweetMetrics.retweet_count || 0) +
          (tweetMetrics.reply_count || 0) +
          (tweetMetrics.quote_count || 0);
      }
    }

    return {
      impressions: totalImpressions,
      reach: totalImpressions, // Twitter doesn't have separate reach
      engagement: totalEngagement,
      clicks: 0, // Not directly available from API
      conversions: 0,
      followers: metrics.followers_count || 0,
    };
  } catch (error) {
    console.error('Error fetching Twitter data:', error);
    return null;
  }
}

/**
 * Calculate percentage change between two values
 */
export function calculateChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Determine trend based on change percentage
 */
export function getTrend(change: number): 'up' | 'down' | 'stable' {
  if (change > 1) return 'up';
  if (change < -1) return 'down';
  return 'stable';
}

