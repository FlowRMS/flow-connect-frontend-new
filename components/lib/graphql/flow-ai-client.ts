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
  // Use the proxy API to avoid CORS issues when calling flow-ai from the browser
  if (typeof window !== 'undefined') {
    return '/api/flow-ai-proxy';
  }
  // Server-side can call directly
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
  // Extract operation name from query for logging
  const operationMatch = options.query.match(/(?:query|mutation)\s+(\w+)/);
  const operationName = operationMatch?.[1] || 'Unknown';
  console.log(`🌐 [flowAIGraphQLRequest] Starting ${operationName}...`);

  const accessToken = await getAccessToken();
  console.log(`🌐 [flowAIGraphQLRequest] Got access token: ${accessToken ? 'YES' : 'NO'}`);

  if (!accessToken) {
    console.error('🌐 [flowAIGraphQLRequest] No access token, redirecting to sign-in');
    if (typeof window !== 'undefined') {
      window.location.href = '/sign-in';
    }
    throw new Error('Authentication required. Redirecting to sign-in...');
  }

  const endpoint = getFlowAIEndpoint();
  console.log(`🌐 [flowAIGraphQLRequest] Endpoint: ${endpoint}`);
  console.log(`🌐 [flowAIGraphQLRequest] Variables:`, options.variables);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'x-auth-provider': 'WORKOS',
  };

  console.log(`🌐 [flowAIGraphQLRequest] Making fetch request...`);
  let response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: options.query,
      variables: options.variables,
      operationName: options.operationName,
    }),
  });
  console.log(`🌐 [flowAIGraphQLRequest] Response status: ${response.status}`);

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
    console.error(`[Flow-AI API] Request failed: ${response.status} ${response.statusText}`);
    throw new Error('Request failed. Try again.');
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

// ============================================================================
// Multipart Upload Request Function (for file uploads)
// ============================================================================

/**
 * Extract files from variables and return paths for the GraphQL multipart spec
 */
function extractFilesFromVariables(
  variables: Record<string, unknown>
): { clone: Record<string, unknown>; files: Map<File, string> } {
  const files = new Map<File, string>();

  function extract(obj: unknown, path: string): unknown {
    if (obj instanceof File) {
      files.set(obj, path);
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.map((item, index) => extract(item, `${path}.${index}`));
    }

    if (obj !== null && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = extract(value, `${path}.${key}`);
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
 * Follows the GraphQL multipart request specification
 * https://github.com/jaydenseric/graphql-multipart-request-spec
 */
export async function flowAIGraphQLMultipartRequest<T = unknown>(
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

  // map: { "0": ["variables.file"], "1": ["variables.files.0"] }
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

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'x-auth-provider': 'WORKOS',
  };

  let response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: formData,
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
        body: formData,
      });
    } else {
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in';
      }
      throw new Error('Authentication expired. Redirecting to sign-in...');
    }
  }

  if (!response.ok) {
    console.error(`[Flow-AI API] Request failed: ${response.status} ${response.statusText}`);
    throw new Error('Request failed. Try again.');
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
