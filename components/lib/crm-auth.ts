/**
 * FlowCRM Authentication Token Storage
 * Stores access and refresh tokens in localStorage for CRM GraphQL API calls
 * Supports both manual token entry and Token Server integration
 * 
 * IMPORTANT: This module now also checks for SSO tokens (access_token/refresh_token)
 * which are set by the /api/auth/receive-token endpoint during SSO authentication.
 * This allows the CRM API to work with both manual token entry AND SSO authentication.
 */

import {
  isTokenServerEnabled,
  tokenServerClient,
  getTokenServerConfig,
  type TokenServerConfig,
} from './crm-token-server';

// localStorage keys for manual CRM token entry
const CRM_ACCESS_TOKEN_KEY = 'flowcrm_access_token';
const CRM_REFRESH_TOKEN_KEY = 'flowcrm_refresh_token';

// localStorage keys for SSO authentication (set by /api/auth/receive-token)
const SSO_ACCESS_TOKEN_KEY = 'access_token';
const SSO_REFRESH_TOKEN_KEY = 'refresh_token';

export interface CRMTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export type AuthMode = 'manual' | 'token-server' | 'sso';

/**
 * Get the current authentication mode
 */
export function getAuthMode(): AuthMode {
  if (isTokenServerEnabled()) {
    return 'token-server';
  }
  
  // Check if we have SSO tokens (takes precedence if no manual CRM tokens)
  if (typeof window !== 'undefined') {
    const hasCRMManualTokens = localStorage.getItem(CRM_ACCESS_TOKEN_KEY) && localStorage.getItem(CRM_REFRESH_TOKEN_KEY);
    const hasSSOTokens = localStorage.getItem(SSO_ACCESS_TOKEN_KEY) && localStorage.getItem(SSO_REFRESH_TOKEN_KEY);
    
    if (hasCRMManualTokens) {
      return 'manual';
    }
    if (hasSSOTokens) {
      return 'sso';
    }
  }
  
  return 'manual';
}

/**
 * Get Token Server configuration (re-exported for convenience)
 */
export { getTokenServerConfig, type TokenServerConfig };

/**
 * Get the stored CRM access token
 * Checks both CRM manual tokens and SSO tokens (SSO tokens are used as fallback)
 */
export function getCRMAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // First check manual CRM tokens
  const crmToken = localStorage.getItem(CRM_ACCESS_TOKEN_KEY);
  if (crmToken) return crmToken;
  
  // Fall back to SSO tokens
  return localStorage.getItem(SSO_ACCESS_TOKEN_KEY);
}

/**
 * Get the stored CRM refresh token
 * Checks both CRM manual tokens and SSO tokens (SSO tokens are used as fallback)
 */
export function getCRMRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // First check manual CRM tokens
  const crmToken = localStorage.getItem(CRM_REFRESH_TOKEN_KEY);
  if (crmToken) return crmToken;
  
  // Fall back to SSO tokens
  return localStorage.getItem(SSO_REFRESH_TOKEN_KEY);
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
 * Checks Token Server, manual CRM tokens, AND SSO tokens
 */
export function hasCRMTokens(): boolean {
  // If Token Server is enabled, check its configuration
  if (isTokenServerEnabled()) {
    const config = getTokenServerConfig();
    return !!(config.serverUrl && config.tenant);
  }
  
  // Check for tokens (getCRMTokens now checks both manual and SSO tokens)
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
