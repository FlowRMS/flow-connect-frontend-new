import { getStoredAccessToken, refreshAccessToken, clearTokens, fetchWorkOSToken } from './auth';
import { triggerReportCacheClear } from './reportCacheControl';

/**
 * Enhanced fetch wrapper that automatically handles authentication
 * - Adds Authorization header if access token is available
 * - Automatically refreshes token on 401/403 responses
 * - Uses WorkOS for token management
 */
export async function httpFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // Get access token from WorkOS
  let accessToken = getStoredAccessToken();
  
  // If no cached token, try to fetch one from WorkOS
  if (!accessToken) {
    accessToken = await fetchWorkOSToken();
  }
  
  // If still no access token, throw error (let caller handle redirect)
  if (!accessToken) {
    throw new Error('No access token available - user may need to sign in');
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
    console.log('[httpFetch] Request unauthorized, attempting token refresh...');
    
    const newAccessToken = await refreshAccessToken();
    
    if (newAccessToken) {
      // Update the access token and retry the request
      accessToken = newAccessToken;
      console.log('[httpFetch] Token refreshed successfully, retrying request...');
      response = await fetch(input, setAuthHeader(init));
    } else {
      // Refresh failed, clear tokens but don't redirect - let caller handle it
      console.log('[httpFetch] Token refresh failed');
      clearTokens();
      triggerReportCacheClear();
      throw new Error('Authentication failed - token refresh unsuccessful');
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
export async function httpFetchJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
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
export async function httpPost<T = unknown>(
  url: string,
  data: unknown,
  init?: RequestInit
): Promise<T> {
  return httpFetchJson<T>(url, {
    ...init,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Helper for GET requests
 */
export async function httpGet<T = unknown>(
  url: string,
  init?: RequestInit
): Promise<T> {
  return httpFetchJson<T>(url, {
    ...init,
    method: 'GET',
  });
}

