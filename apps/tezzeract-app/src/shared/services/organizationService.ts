import { createAuthenticatedApi, getSupabaseToken } from './api';

const api = createAuthenticatedApi(getSupabaseToken);

export interface Organization {
  id: string;
  user_id: string;
  name: string;
  industry?: string;
  website?: string;
  description?: string;
  based_in?: string;
  company_size?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationResponse {
  organization: Organization | null;
}

/**
 * Get the current user's organization
 */
export const getOrganization = async (): Promise<OrganizationResponse> => {
  try {
    const response = await api.get('/organization');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching organization:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication required');
    }
    throw error;
  }
};

/**
 * Create a new organization
 */
export const createOrganization = async (
  organization: Omit<Organization, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<OrganizationResponse> => {
  try {
    const response = await api.post('/organization', organization);
    return response.data;
  } catch (error: any) {
    console.error('Error creating organization:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication required');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data.error || 'Failed to create organization');
    }
    throw error;
  }
};

/**
 * Update the current user's organization
 */
export const updateOrganization = async (
  organization: Partial<Omit<Organization, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<OrganizationResponse> => {
  try {
    const response = await api.put('/organization', organization);
    return response.data;
  } catch (error: any) {
    console.error('Error updating organization:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication required');
    }
    if (error.response?.status === 404) {
      throw new Error(error.response.data.error || 'Organization not found');
    }
    throw error;
  }
};

