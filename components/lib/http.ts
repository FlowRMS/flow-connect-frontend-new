/**
 * FlowCRM HTTP Utilities
 * Enhanced fetch wrapper with automatic authentication
 * Mirrors the flow-analytics http implementation exactly
 */

import { getStoredAccessToken, refreshAccessToken, clearTokens } from './auth';
import { redirectToLogin } from './redirect';

/**
 * Enhanced fetch wrapper that automatically handles authentication
 * - Adds Authorization header if access token is available
 * - Automatically refreshes token on 401/403 responses
 * - Redirects to external app if authentication fails completely
 */
export async function httpFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Check if we have an access token
  let accessToken = getStoredAccessToken();

  // If no access token at all, redirect immediately
  if (!accessToken) {
    if (typeof window !== 'undefined') {
      clearTokens();
      redirectToLogin();
    }
    throw new Error('No access token available');
  }

  // Helper function to set auth header
  const setAuthHeader = (requestInit: RequestInit = {}): RequestInit => {
    const headers = new Headers(requestInit.headers);
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return {
      ...requestInit,
      headers,
    };
  };

  // Make the initial request with auth header
  let response = await fetch(input, setAuthHeader(init));

  // If unauthorized (401 or 403), try to refresh token once
  if (response.status === 401 || response.status === 403) {
    console.log('Request unauthorized, attempting token refresh...');

    const newAccessToken = await refreshAccessToken();

    if (newAccessToken) {
      // Update the access token and retry the request
      accessToken = newAccessToken;
      console.log('Token refreshed successfully, retrying request...');
      response = await fetch(input, setAuthHeader(init));
    } else {
      // Refresh failed, clear tokens and redirect
      console.log('Token refresh failed, redirecting to external app...');
      clearTokens();
      if (typeof window !== 'undefined') {
        redirectToLogin();
      }
      throw new Error('Authentication failed - redirecting to login');
    }
  }

  return response;
}

/**
 * Helper function to add auth header to existing RequestInit
 * Use this if you need to manually add auth headers without using httpFetch
 */
export function setAuthHeader(init: RequestInit = {}): RequestInit {
  const accessToken = getStoredAccessToken();

  if (!accessToken) {
    return init;
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);

  return {
    ...init,
    headers,
  };
}

/**
 * Type-safe wrapper for JSON API calls
 */
export async function httpFetchJson<T = unknown>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await httpFetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Helper for POST requests with JSON body
 */
export async function httpPost<T = unknown>(url: string, data: unknown, init?: RequestInit): Promise<T> {
  return httpFetchJson<T>(url, {
    ...init,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Helper for GET requests
 */
export async function httpGet<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  return httpFetchJson<T>(url, {
    ...init,
    method: 'GET',
  });
}
