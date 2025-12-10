import { supabase } from '../config/supabase.js';

/**
 * Fetch Google Analytics properties for a user
 * Uses Google Analytics Data API (GA4) to list properties
 */
export async function getGoogleAnalyticsProperties(userId: string): Promise<Array<{ id: string; name: string; accountId: string }>> {
  // Get the user's Google Analytics connection
  const { data: connection, error } = await supabase
    .from('platform_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('platform_id', 'google_analytics')
    .single();

  if (error || !connection || !connection.access_token) {
    throw new Error('Google Analytics not connected or access token missing');
  }

  // Use Analytics Admin API to list accounts
  const accountsResponse = await fetch('https://analyticsadmin.googleapis.com/v1beta/accounts', {
    headers: {
      Authorization: `Bearer ${connection.access_token}`,
    },
  });

  if (!accountsResponse.ok) {
    const errorText = await accountsResponse.text();
    // If Admin API fails, try Management API v3 as fallback
    try {
      return await getPropertiesFromManagementAPI(connection.access_token);
    } catch (fallbackError) {
      throw new Error(`Failed to fetch accounts: ${errorText}`);
    }
  }

  const accountsData = await accountsResponse.json() as { accounts?: any[] };
  const accounts = accountsData.accounts || [];

  if (accounts.length === 0) {
    // Try Management API as fallback
    return await getPropertiesFromManagementAPI(connection.access_token);
  }

  // Fetch properties for each account using Admin API
  const allProperties: Array<{ id: string; name: string; accountId: string }> = [];

  for (const account of accounts) {
    const accountId = account.name.split('/')[1];
    const propertiesResponse = await fetch(
      `https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:accounts/${accountId}`,
      {
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
        },
      }
    );

    if (propertiesResponse.ok) {
      const propertiesData = await propertiesResponse.json() as { properties?: any[] };
      const properties = propertiesData.properties || [];

      for (const property of properties) {
        allProperties.push({
          id: property.name.split('/')[1] || property.name, // Extract property ID
          name: property.displayName || property.name,
          accountId: accountId,
        });
      }
    }
  }

  return allProperties.length > 0 ? allProperties : await getPropertiesFromManagementAPI(connection.access_token);
}

/**
 * Fallback: Use Management API v3 to get properties
 */
async function getPropertiesFromManagementAPI(accessToken: string): Promise<Array<{ id: string; name: string; accountId: string }>> {
  // First get accounts
  const accountsResponse = await fetch('https://www.googleapis.com/analytics/v3/management/accounts', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!accountsResponse.ok) {
    throw new Error('Failed to fetch accounts from Management API');
  }

  const accountsData = await accountsResponse.json() as { items?: any[] };
  const accounts = accountsData.items || [];

  const allProperties: Array<{ id: string; name: string; accountId: string }> = [];

  for (const account of accounts) {
    // Get web properties for this account
    const propertiesResponse = await fetch(
      `https://www.googleapis.com/analytics/v3/management/accounts/${account.id}/webproperties`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (propertiesResponse.ok) {
      const propertiesData = await propertiesResponse.json() as { items?: any[] };
      const properties = propertiesData.items || [];

      for (const property of properties) {
        allProperties.push({
          id: property.id,
          name: property.name,
          accountId: account.id,
        });
      }
    }
  }

  return allProperties;
}

/**
 * Update Google Analytics connection with selected property
 */
export async function updateGoogleAnalyticsProperty(
  userId: string,
  propertyId: string,
  propertyName: string
): Promise<void> {
  const { error } = await supabase
    .from('platform_connections')
    .update({
      metadata: {
        property_id: propertyId,
        property_name: propertyName,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('platform_id', 'google_analytics');

  if (error) {
    throw new Error(`Failed to update property: ${error.message}`);
  }
}

