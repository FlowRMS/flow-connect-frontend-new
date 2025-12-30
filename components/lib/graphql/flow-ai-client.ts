/**
 * GraphQL Client for flow-ai Backend
 * Used for Takeoffs, Product Crosses, and Document Processing
 */

// ============================================================================
// Token Management (shared with main client)
// ============================================================================

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  if (cachedToken && Date.now() < tokenExpiry - 30000) {
    return cachedToken;
  }

  try {
    const response = await fetch("/api/auth/token");
    if (!response.ok) {
      cachedToken = null;
      return null;
    }
    const data = await response.json();
    cachedToken = data.accessToken;
    tokenExpiry = Date.now() + 5 * 60 * 1000;
    return cachedToken;
  } catch {
    cachedToken = null;
    return null;
  }
}

export function clearFlowAITokenCache(): void {
  cachedToken = null;
  tokenExpiry = 0;
}

// ============================================================================
// Configuration
// ============================================================================

const getFlowAIEndpoint = (): string => {
  const endpoint = process.env.NEXT_PUBLIC_FLOW_AI_GRAPHQL_URL;
  if (!endpoint) {
    console.warn('NEXT_PUBLIC_FLOW_AI_GRAPHQL_URL not set, using default localhost:8005');
    return 'http://localhost:8005/graphql';
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

// ============================================================================
// Core GraphQL Request Function
// ============================================================================

/**
 * Execute a GraphQL query/mutation against the flow-ai API
 * Uses WorkOS AuthKit for authentication
 */
export async function flowAIGraphQLRequest<T = unknown>(
  options: GraphQLRequestOptions
): Promise<GraphQLResponse<T>> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    if (typeof window !== 'undefined') {
      window.location.href = '/sign-in';
    }
    throw new Error('Authentication required. Redirecting to sign-in...');
  }

  const endpoint = getFlowAIEndpoint();

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

  // Handle 401/403 responses
  if (response.status === 401 || response.status === 403) {
    clearFlowAITokenCache();
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
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in';
      }
      throw new Error('Authentication expired. Redirecting to sign-in...');
    }
  }

  if (!response.ok) {
    throw new Error(`Flow-AI API request failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json() as GraphQLResponse<T>;

  if (result.errors?.some(error =>
    error.message?.toLowerCase().includes('signature has expired') ||
    error.message?.toLowerCase().includes('unauthorized')
  )) {
    clearFlowAITokenCache();
    if (typeof window !== 'undefined') {
      window.location.href = '/sign-in';
    }
    throw new Error('Session expired. Redirecting to sign-in...');
  }

  return result;
}
