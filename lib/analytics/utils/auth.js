import { fetchWorkOSToken, getValidAccessToken } from '@/lib/analytics/lib/auth';

/**
 * Get access token from WorkOS
 * This replaces the old Keycloak-based localStorage approach
 */
export async function getAccessToken() {
  const token = await getValidAccessToken();
  
  if (!token) {
    throw new Error('No access token available - user may need to sign in');
  }
  
  return token;
}

/**
 * Alias for getAccessToken for backward compatibility
 */
export { fetchWorkOSToken };

