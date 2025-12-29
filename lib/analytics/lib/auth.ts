import { triggerReportCacheClear } from './reportCacheControl';

/**
 * Auth utility functions for WorkOS token management
 * 
 * These functions integrate with the CRM's WorkOS authentication
 * instead of using localStorage-based Keycloak tokens.
 */

export interface TokenData {
  access_token: string;
  refresh_token?: string;
}

// Token cache for WorkOS
let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get access token from WorkOS via the CRM's auth API
 * This fetches from /api/auth/token which uses WorkOS AuthKit
 */
export async function fetchWorkOSToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // Use cached token if still valid (with 30 second buffer)
  if (cachedAccessToken && Date.now() < tokenExpiry - 30000) {
    return cachedAccessToken;
  }

  try {
    const response = await fetch('/api/auth/token');
    if (!response.ok) {
      cachedAccessToken = null;
      return null;
    }
    const data = await response.json();
    cachedAccessToken = data.accessToken;
    // Token expires in 5 minutes
    tokenExpiry = Date.now() + 5 * 60 * 1000;
    return cachedAccessToken;
  } catch (error) {
    console.error('[Analytics Auth] Failed to get WorkOS token:', error);
    cachedAccessToken = null;
    return null;
  }
}

/**
 * Get stored access token - now returns cached WorkOS token
 * This is a synchronous fallback; prefer fetchWorkOSToken for reliable auth
 */
export function getStoredAccessToken(): string | null {
  // Return cached token if available and not expired
  if (cachedAccessToken && Date.now() < tokenExpiry - 30000) {
    return cachedAccessToken;
  }
  // For backward compatibility, we return the cached token even if potentially expired
  // The caller should handle 401 errors appropriately
  return cachedAccessToken;
}

/**
 * Get stored refresh token - WorkOS handles refresh automatically
 * Returns a placeholder since WorkOS manages refresh internally
 */
export function getStoredRefreshToken(): string | null {
  // WorkOS handles token refresh automatically via the API
  // Return a truthy value to indicate auth is available
  if (typeof window === 'undefined') return null;
  return cachedAccessToken ? 'workos-managed' : null;
}

/**
 * Store tokens - with WorkOS, tokens are managed by the API
 * This caches the token locally for performance
 */
export function setTokens(accessToken: string, _refreshToken?: string): void {
  cachedAccessToken = accessToken;
  tokenExpiry = Date.now() + 5 * 60 * 1000;
}

/**
 * Clear all stored tokens
 */
export function clearTokens(): void {
  cachedAccessToken = null;
  tokenExpiry = 0;
  triggerReportCacheClear();
}

/**
 * Check if a JWT token is expired
 */
function isTokenExpired(token: string): boolean {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Add 30 second buffer
    return Date.now() / 1000 > payload.exp - 30;
  } catch {
    return true;
  }
}

/**
 * Refresh access token using WorkOS API
 * Returns new access token or null if refresh fails
 */
export async function refreshAccessToken(): Promise<string | null> {
  // Clear the cache to force a fresh token fetch
  cachedAccessToken = null;
  tokenExpiry = 0;
  
  return fetchWorkOSToken();
}

/**
 * Get a valid access token, refreshing if necessary
 * Uses WorkOS API to get/refresh tokens
 */
export async function getValidAccessToken(): Promise<string | null> {
  // Try to get cached token first
  if (cachedAccessToken && Date.now() < tokenExpiry - 30000) {
    if (!isTokenExpired(cachedAccessToken)) {
      return cachedAccessToken;
    }
  }

  // Fetch fresh token from WorkOS
  return fetchWorkOSToken();
}

/**
 * Check if user is authenticated (has valid tokens)
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if we have a cached token
  return !!(cachedAccessToken && Date.now() < tokenExpiry - 30000);
}

/**
 * Check authentication status asynchronously
 */
export async function checkAuthAsync(): Promise<boolean> {
  const token = await fetchWorkOSToken();
  return !!token;
}

/**
 * Redirect to external authentication app - DEPRECATED
 * Auth is handled by CRM middleware
 */
export function redirectToAuth(): void {
  // No-op: Auth is handled by CRM middleware
  console.warn("[Analytics] redirectToAuth called but auth is handled by CRM middleware");
}

/**
 * Decode JWT token with robust Base64Url handling
 * Follows the pattern: JSON.parse(atob(payload)) but handles Base64Url and UTF-8
 */
export function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as Record<string, unknown>;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Extract user info from token using robust decoder
 * Extracts preferred_username, email, name and other fields
 */
export function getUserInfoFromToken(): Record<string, unknown> | null {
  const token = getStoredAccessToken();
  if (!token) return null;

  const payload = decodeJWT(token);
  if (!payload) return null;
  
  return {
    ...payload,
    username: (payload.preferred_username as string) || (payload.username as string) || (payload.sub as string) || '',
    email: (payload.email as string) || (payload.unique_name as string) || '',
    name: (payload.name as string) || (payload.given_name as string) || '',
    preferred_username: payload.preferred_username
  };
}

