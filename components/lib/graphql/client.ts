/**
 * GraphQL Client Core
 * Core GraphQL client for interacting with the CRM API
 * Uses WorkOS AuthKit for authentication
 */

import { isUserNotFoundError, triggerGlobalUnauthorized } from '@/components/lib/unauthorized-handler';

// ============================================================================
// WorkOS Token Management
// ============================================================================

let cachedToken: string | null = null;
let tokenExpiry: number = 0;
let authErrorCount = 0;
const MAX_AUTH_ERRORS = 3;

/**
 * Fetch access token from WorkOS via /api/auth/token endpoint
 * Caches token for 5 minutes with 30-second buffer
 */
async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  // Return cached token if still valid (with 30s buffer)
  if (cachedToken && Date.now() < tokenExpiry - 30000) {
    return cachedToken;
  }

  try {
    const response = await fetch("/api/auth/token");
    if (!response.ok) {
      cachedToken = null;
      authErrorCount++;
      return null;
    }
    const data = await response.json();
    cachedToken = data.accessToken;
    // Cache for 5 minutes
    tokenExpiry = Date.now() + 5 * 60 * 1000;
    authErrorCount = 0; // Reset error count on success
    return cachedToken;
  } catch {
    cachedToken = null;
    authErrorCount++;
    return null;
  }
}

/**
 * Check if we've hit too many auth errors (prevents redirect loops)
 */
export function hasAuthErrorLoop(): boolean {
  return authErrorCount >= MAX_AUTH_ERRORS;
}

/**
 * Reset auth error count (call after successful sign-out)
 */
export function resetAuthErrors(): void {
  authErrorCount = 0;
}

/**
 * Clear token cache (call on sign out)
 */
export function clearTokenCache(): void {
  cachedToken = null;
  tokenExpiry = 0;
}

// ============================================================================
// Configuration
// ============================================================================

const getGraphQLEndpoint = (): string => {
  const endpoint = process.env.NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL;
  if (!endpoint) {
    throw new Error('NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL environment variable is not set');
  }
  return endpoint;
};

// ============================================================================
// Types
// ============================================================================

export interface GraphQLRequestOptions {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
  }>;
}

export type CreatedByResponse =
  | string
  | null
  | undefined
  | {
      email?: string | null;
      firstName?: string | null;
      fullName?: string | null;
      id?: string | null;
      lastName?: string | null;
    };

export const formatCreatedBy = (value: CreatedByResponse): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const fullName = value.fullName || [value.firstName, value.lastName].filter(Boolean).join(' ').trim();
  return fullName || value.email || value.id || '';
};

export const withFormattedCreatedBy = <T extends { createdBy?: CreatedByResponse }>(item: T): T => ({
  ...item,
  createdBy: formatCreatedBy(item.createdBy),
});

export const mapFormattedCreatedBy = <T extends { createdBy?: CreatedByResponse }>(items?: T[]): T[] =>
  (items || []).map(withFormattedCreatedBy);

// ============================================================================
// Core GraphQL Request Function
// ============================================================================

/**
 * Check if a value is an extractable file (File, Blob, or FileList)
 */
function isExtractableFileValue(value: unknown): value is File | Blob {
  return (
    (typeof File !== 'undefined' && value instanceof File) ||
    (typeof Blob !== 'undefined' && value instanceof Blob)
  );
}

/**
 * Extract files from variables and replace with null
 */
function extractFilesFromVariables(
  variables: Record<string, unknown>
): { clone: Record<string, unknown>; files: Map<File | Blob, string> } {
  const files = new Map<File | Blob, string>();

  function extract(obj: unknown, path: string): unknown {
    if (isExtractableFileValue(obj)) {
      files.set(obj, path);
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.map((item, index) => extract(item, `${path}.${index}`));
    }

    if (obj !== null && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(obj)) {
        const newPath = path ? `${path}.${key}` : key;
        result[key] = extract(val, newPath);
      }
      return result;
    }

    return obj;
  }

  const clone = extract(variables, 'variables') as Record<string, unknown>;
  return { clone, files };
}

/**
 * Execute a GraphQL mutation with file upload using multipart/form-data
 * Uses a Next.js API route as proxy to avoid CORS/middleware issues
 * Follows the GraphQL multipart request specification
 * https://github.com/jaydenseric/graphql-multipart-request-spec
 */
export async function crmGraphQLMultipartRequest<T = unknown>(
  options: GraphQLRequestOptions
): Promise<GraphQLResponse<T>> {
  // Get access token from WorkOS
  const accessToken = await getAccessToken();

  if (!accessToken) {
    // Redirect to sign-in to re-authenticate (not auth-error which is for unauthorized users)
    if (typeof window !== 'undefined') {
      window.location.href = '/sign-in';
    }
    throw new Error('Session expired. Please sign in again.');
  }

  // Use the upload proxy endpoint
  const uploadProxyUrl = '/api/upload';

  // Extract files from variables
  const { clone, files } = extractFilesFromVariables(options.variables || {});

  // Build FormData according to GraphQL multipart spec
  const formData = new FormData();

  // operations: query + variables with files replaced by null
  const operations = {
    query: options.query,
    variables: clone,
    operationName: options.operationName,
  };
  formData.append('operations', JSON.stringify(operations));

  // map: { "0": ["variables.file"] }
  const map: Record<string, string[]> = {};
  let fileIndex = 0;
  files.forEach((path) => {
    map[fileIndex.toString()] = [path];
    fileIndex++;
  });
  formData.append('map', JSON.stringify(map));

  // Append each file
  fileIndex = 0;
  files.forEach((_path, file) => {
    formData.append(fileIndex.toString(), file);
    fileIndex++;
  });

  // Headers for the proxy
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'x-auth-provider': 'WORKOS',
  };

  let response = await fetch(uploadProxyUrl, {
    method: 'POST',
    headers,
    body: formData,
  });

  // Handle 401/403 responses - clear cache and retry once
  if (response.status === 401 || response.status === 403) {
    clearTokenCache();
    const freshToken = await getAccessToken();

    if (freshToken) {
      headers['Authorization'] = `Bearer ${freshToken}`;
      response = await fetch(uploadProxyUrl, {
        method: 'POST',
        headers,
        body: formData,
      });
    } else {
      // Token refresh failed, redirect to sign-in to re-authenticate
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in';
      }
      throw new Error('Session expired. Please sign in again.');
    }
  }

  if (!response.ok) {
    throw new Error(`CRM API request failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json() as GraphQLResponse<T>;

  // Check for UserNotFoundError - user not authorized on tenancy
  if (isUserNotFoundError(result.errors)) {
    clearTokenCache();
    if (typeof window !== 'undefined') {
      triggerGlobalUnauthorized();
    }
    throw new Error('User not authorized on this tenancy.');
  }

  // Check for signature expired error in GraphQL response - retry with fresh token
  if (result.errors?.some(error =>
    error.message?.toLowerCase().includes('signature has expired') ||
    error.message?.toLowerCase().includes('unauthorized')
  )) {
    clearTokenCache();
    const freshToken = await getAccessToken();

    if (freshToken) {
      headers['Authorization'] = `Bearer ${freshToken}`;
      const retryResponse = await fetch(uploadProxyUrl, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (retryResponse.ok) {
        const retryResult = await retryResponse.json() as GraphQLResponse<T>;

        if (retryResult.errors?.some(error =>
          error.message?.toLowerCase().includes('signature has expired') ||
          error.message?.toLowerCase().includes('unauthorized')
        )) {
          if (typeof window !== 'undefined') {
            window.location.href = '/sign-in';
          }
          throw new Error('Session expired. Please sign in again.');
        }

        return retryResult;
      }
    }

    if (typeof window !== 'undefined') {
      window.location.href = '/sign-in';
    }
    throw new Error('Session expired. Please sign in again.');
  }

  return result;
}

/**
 * Execute a GraphQL query/mutation against the CRM API
 * Uses WorkOS AuthKit for authentication
 */
export async function crmGraphQLRequest<T = unknown>(
  options: GraphQLRequestOptions
): Promise<GraphQLResponse<T>> {
  // Get access token from WorkOS
  const accessToken = await getAccessToken();

  if (!accessToken) {
    // Redirect to sign-in to re-authenticate (not auth-error which is for unauthorized users)
    if (typeof window !== 'undefined') {
      window.location.href = '/sign-in';
    }
    throw new Error('Session expired. Please sign in again.');
  }

  const endpoint = getGraphQLEndpoint();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'x-auth-provider': 'WORKOS',
  };

  let response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: options.query,
      variables: options.variables,
      operationName: options.operationName,
    }),
  });

  // Handle 401/403 responses - clear cache and retry once
  if (response.status === 401 || response.status === 403) {
    // Clear cached token and try to get a fresh one
    clearTokenCache();
    const freshToken = await getAccessToken();

    if (freshToken) {
      headers['Authorization'] = `Bearer ${freshToken}`;
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: options.query,
          variables: options.variables,
          operationName: options.operationName,
        }),
      });
    } else {
      // Token refresh failed, redirect to sign-in to re-authenticate
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in';
      }
      throw new Error('Session expired. Please sign in again.');
    }
  }

  if (!response.ok) {
    throw new Error(`CRM API request failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json() as GraphQLResponse<T>;

  // Check for UserNotFoundError - user not authorized on tenancy
  if (isUserNotFoundError(result.errors)) {
    clearTokenCache();
    if (typeof window !== 'undefined') {
      triggerGlobalUnauthorized();
    }
    throw new Error('User not authorized on this tenancy.');
  }

  // Check for signature expired error in GraphQL response - retry with fresh token
  if (result.errors?.some(error =>
    error.message?.toLowerCase().includes('signature has expired') ||
    error.message?.toLowerCase().includes('unauthorized')
  )) {
    clearTokenCache();
    const freshToken = await getAccessToken();

    if (freshToken) {
      headers['Authorization'] = `Bearer ${freshToken}`;
      const retryResponse = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: options.query,
          variables: options.variables,
          operationName: options.operationName,
        }),
      });

      if (retryResponse.ok) {
        const retryResult = await retryResponse.json() as GraphQLResponse<T>;

        // If retry also has auth errors, only then redirect
        if (retryResult.errors?.some(error =>
          error.message?.toLowerCase().includes('signature has expired') ||
          error.message?.toLowerCase().includes('unauthorized')
        )) {
          if (typeof window !== 'undefined') {
            window.location.href = '/sign-in';
          }
          throw new Error('Session expired. Please sign in again.');
        }

        return retryResult;
      }
    }

    // Fresh token unavailable or retry failed, redirect as last resort
    if (typeof window !== 'undefined') {
      window.location.href = '/sign-in';
    }
    throw new Error('Session expired. Please sign in again.');
  }

  return result;
}
