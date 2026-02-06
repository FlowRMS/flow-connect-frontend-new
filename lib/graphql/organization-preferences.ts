/**
 * Organization Preferences GraphQL SDK
 * 
 * Handles reading and updating organization-level preferences/settings.
 */

import { requestGraphQL } from '../graphqlClient';
import type {
  Application,
  OrganizationPreferenceResponse,
  OrganizationPreferenceResult,
  OrganizationPreferencesResult,
  OrganizationPreferencesByApplicationResult,
  UpdateOrganizationPreferenceResult,
} from './types';

// ============================================
// QUERIES
// ============================================

const OrganizationPreferenceQuery = `
  query OrganizationPreference($application: Application!, $key: String!) {
    organizationPreference(application: $application, key: $key) {
      application
      key
      value
    }
  }
`;

const OrganizationPreferencesByApplicationQuery = `
  query OrganizationPreferencesByApplication($application: Application!) {
    organizationPreferencesByApplication(application: $application) {
      application
      key
      value
    }
  }
`;

const OrganizationPreferencesQuery = `
  query OrganizationPreferences {
    organizationPreferences {
      application
      key
      value
    }
  }
`;

// ============================================
// MUTATIONS
// ============================================

const UpdateOrganizationPreferenceMutation = `
  mutation UpdateOrganizationPreference($application: Application!, $key: String!, $value: String) {
    updateOrganizationPreference(application: $application, key: $key, value: $value) {
      application
      key
      value
    }
  }
`;

// ============================================
// SDK FUNCTIONS
// ============================================

/**
 * Get a specific organization preference by application and key.
 */
export async function getOrganizationPreference(
  application: Application,
  key: string,
  token?: string
): Promise<OrganizationPreferenceResponse | null> {
  try {
    const result = await requestGraphQL<OrganizationPreferenceResult>(
      OrganizationPreferenceQuery,
      { application, key },
      token
    );
    return result.organizationPreference;
  } catch (error) {
    console.error('getOrganizationPreference failed:', error);
    throw error;
  }
}

/**
 * Get all preferences for a specific application.
 */
export async function getOrganizationPreferencesByApplication(
  application: Application,
  token?: string
): Promise<OrganizationPreferenceResponse[]> {
  try {
    const result = await requestGraphQL<OrganizationPreferencesByApplicationResult>(
      OrganizationPreferencesByApplicationQuery,
      { application },
      token
    );
    return result.organizationPreferencesByApplication;
  } catch (error) {
    console.error('getOrganizationPreferencesByApplication failed:', error);
    throw error;
  }
}

/**
 * Get all organization preferences across all applications.
 */
export async function getAllOrganizationPreferences(
  token?: string
): Promise<OrganizationPreferenceResponse[]> {
  try {
    const result = await requestGraphQL<OrganizationPreferencesResult>(
      OrganizationPreferencesQuery,
      {},
      token
    );
    return result.organizationPreferences;
  } catch (error) {
    console.error('getAllOrganizationPreferences failed:', error);
    throw error;
  }
}

/**
 * Update an organization preference.
 * Pass null as value to clear/delete the preference.
 */
export async function updateOrganizationPreference(
  application: Application,
  key: string,
  value: string | null,
  token?: string
): Promise<OrganizationPreferenceResponse> {
  try {
    const result = await requestGraphQL<UpdateOrganizationPreferenceResult>(
      UpdateOrganizationPreferenceMutation,
      { application, key, value },
      token
    );
    return result.updateOrganizationPreference;
  } catch (error) {
    console.error('updateOrganizationPreference failed:', error);
    throw error;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert preferences array to a key-value map for easier access.
 */
export function preferencesToMap(
  preferences: OrganizationPreferenceResponse[]
): Record<string, string | null> {
  return preferences.reduce((acc, pref) => {
    acc[pref.key] = pref.value;
    return acc;
  }, {} as Record<string, string | null>);
}

/**
 * Get a preference value with a default fallback.
 */
export function getPreferenceValue(
  preferences: OrganizationPreferenceResponse[],
  key: string,
  defaultValue: string = ''
): string {
  const pref = preferences.find(p => p.key === key);
  return pref?.value ?? defaultValue;
}
