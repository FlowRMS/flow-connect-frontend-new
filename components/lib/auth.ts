/**
 * FlowCRM Authentication Module
 * Handles access and refresh tokens for FlowRMS SSO integration
 * Mirrors the flow-analytics auth implementation exactly
 */

import { redirectToLogin } from './redirect';

// ============================================================================
// Types
// ============================================================================

export interface TokenData {
  access_token: string;
  refresh_token?: string;
}

// ============================================================================
// Token Storage Functions
// ============================================================================

/**
 * Get stored access token from localStorage
 */
export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

/**
 * Get stored refresh token from localStorage
 */
export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}

/**
 * Store tokens in localStorage
 */
export function setTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('access_token', accessToken);
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
}

/**
 * Clear all stored tokens
 */
export function clearTokens(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// ============================================================================
// Token Validation Functions
// ============================================================================

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

// ============================================================================
// Token Refresh Functions
// ============================================================================

/**
 * Refresh access token using stored refresh token
 * Returns new access token or null if refresh fails
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch('https://py.report.flowrms.com/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data: TokenData = await response.json();

    // Store the new access token
    if (data.access_token) {
      setTokens(data.access_token, data.refresh_token);
      return data.access_token;
    }

    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
}

/**
 * Get a valid access token, refreshing if necessary
 * Redirects to external app if authentication fails
 */
export async function getValidAccessToken(): Promise<string | null> {
  const accessToken = getStoredAccessToken();

  // If we have a valid access token, return it
  if (accessToken && !isTokenExpired(accessToken)) {
    return accessToken;
  }

  // Try to refresh the token
  const newAccessToken = await refreshAccessToken();

  if (newAccessToken) {
    return newAccessToken;
  }

  // If refresh failed, clear tokens and redirect
  clearTokens();
  if (typeof window !== 'undefined') {
    redirectToLogin();
  }

  return null;
}

// ============================================================================
// Authentication Status Functions
// ============================================================================

/**
 * Check if user is authenticated (has valid tokens)
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;

  const accessToken = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();

  return !!(accessToken && refreshToken);
}

/**
 * Check if user has tokens (may be expired)
 */
export function hasTokens(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(getStoredAccessToken() || getStoredRefreshToken());
}

/**
 * Redirect to external authentication app
 */
export function redirectToAuth(): void {
  if (typeof window !== 'undefined') {
    redirectToLogin();
  }
}

// ============================================================================
// JWT Decoding Functions
// ============================================================================

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
    username:
      (payload.preferred_username as string) ||
      (payload.username as string) ||
      (payload.sub as string) ||
      '',
    email: (payload.email as string) || (payload.unique_name as string) || '',
    name: (payload.name as string) || (payload.given_name as string) || '',
    preferred_username: payload.preferred_username,
  };
}
