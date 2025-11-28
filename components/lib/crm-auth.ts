/**
 * FlowCRM Authentication Token Storage
 * Stores access and refresh tokens in localStorage for CRM GraphQL API calls
 * Supports both manual token entry and Token Server integration
 */

import {
  isTokenServerEnabled,
  tokenServerClient,
  getTokenServerConfig,
  type TokenServerConfig,
} from './crm-token-server';

// localStorage keys
const CRM_ACCESS_TOKEN_KEY = 'flowcrm_access_token';
const CRM_REFRESH_TOKEN_KEY = 'flowcrm_refresh_token';

export interface CRMTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export type AuthMode = 'manual' | 'token-server';

/**
 * Get the current authentication mode
 */
export function getAuthMode(): AuthMode {
  return isTokenServerEnabled() ? 'token-server' : 'manual';
}

/**
 * Get Token Server configuration (re-exported for convenience)
 */
export { getTokenServerConfig, type TokenServerConfig };

/**
 * Get the stored CRM access token
 */
export function getCRMAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CRM_ACCESS_TOKEN_KEY);
}

/**
 * Get the stored CRM refresh token
 */
export function getCRMRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CRM_REFRESH_TOKEN_KEY);
}

/**
 * Get both CRM tokens
 */
export function getCRMTokens(): CRMTokens {
  return {
    accessToken: getCRMAccessToken(),
    refreshToken: getCRMRefreshToken(),
  };
}

/**
 * Set the CRM access token
 */
export function setCRMAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CRM_ACCESS_TOKEN_KEY, token);
}

/**
 * Set the CRM refresh token
 */
export function setCRMRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CRM_REFRESH_TOKEN_KEY, token);
}

/**
 * Set both CRM tokens
 */
export function setCRMTokens(accessToken: string, refreshToken: string): void {
  setCRMAccessToken(accessToken);
  setCRMRefreshToken(refreshToken);
}

/**
 * Clear all CRM tokens
 */
export function clearCRMTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CRM_ACCESS_TOKEN_KEY);
  localStorage.removeItem(CRM_REFRESH_TOKEN_KEY);
}

/**
 * Check if CRM tokens are configured
 */
export function hasCRMTokens(): boolean {
  // If Token Server is enabled, check its configuration
  if (isTokenServerEnabled()) {
    const config = getTokenServerConfig();
    return !!(config.serverUrl && config.tenant);
  }
  
  // Otherwise check manual tokens
  const tokens = getCRMTokens();
  return !!(tokens.accessToken && tokens.refreshToken);
}

/**
 * Check Token Server health
 */
export async function checkTokenServerHealth(): Promise<{ healthy: boolean; message: string }> {
  try {
    const health = await tokenServerClient.checkHealth();
    return {
      healthy: true,
      message: `Token Server healthy. Cached tokens: ${health.cached_tokens}`,
    };
  } catch (error) {
    return {
      healthy: false,
      message: error instanceof Error ? error.message : 'Health check failed',
    };
  }
}

/**
 * Get access token - handles both manual and Token Server modes
 */
export async function getAccessTokenAsync(): Promise<string> {
  if (isTokenServerEnabled()) {
    return tokenServerClient.getAccessToken();
  }
  
  const token = getCRMAccessToken();
  if (!token) {
    throw new Error('No access token configured');
  }
  return token;
}

/**
 * Get authorization header - handles both modes
 */
export async function getAuthorizationHeaderAsync(): Promise<string> {
  if (isTokenServerEnabled()) {
    return tokenServerClient.getAuthorizationHeader();
  }
  
  const token = getCRMAccessToken();
  if (!token) {
    throw new Error('No access token configured');
  }
  return `Bearer ${token}`;
}
