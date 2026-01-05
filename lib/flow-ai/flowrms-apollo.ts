"use client";

import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  from,
  createHttpLink,
  Observable,
  split,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { isExtractableFile } from "./extractable-file";
import { print } from "graphql";

// FlowAI API endpoint - Use CRM's proxy for authenticated requests with WorkOS auth
const FLOWRMS_GRAPHQL_URL = '/api/flow-ai/graphql'; // Proxy that handles WorkOS cookie-based auth
const UPLOAD_PROXY_URL = '/api/flow-ai/upload'; // Use our proxy for uploads to avoid CORS

console.log('🔧 FlowAI Apollo Client configured with:');
console.log('🔧 GraphQL URL:', FLOWRMS_GRAPHQL_URL, '(CRM proxied with WorkOS auth)');
console.log('🔧 Upload Proxy URL:', UPLOAD_PROXY_URL);
console.log('🔧 Authentication: WorkOS cookie-based');

// Error link to handle authentication failures
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorLink = onError(({ graphQLErrors, networkError }: any) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      // Check for authentication errors
      if (
        err.message?.toLowerCase().includes('unauthorized') ||
        err.message?.toLowerCase().includes('unauthenticated') ||
        err.extensions?.code === 'UNAUTHENTICATED'
      ) {
        console.error('🔒 FlowRMS API authentication error detected - middleware will handle redirect');
        // Middleware will catch this and redirect to Keycloak login
        return;
      }
    }
  }

  if (networkError && 'statusCode' in networkError) {
    // Check for 401 Unauthorized
    if (networkError.statusCode === 401 || networkError.statusCode === 403) {
      console.error('🔒 FlowRMS API authentication error (401/403) - middleware will handle redirect');
      // Middleware will catch this and redirect to Keycloak login
      return;
    }
  }
});

// Auth link - minimal, the /api/graphql proxy handles authentication from cookies
const authLink = new ApolloLink((operation, forward) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("flowrms_access_token")
      : null;

  const refreshToken =
    typeof window !== "undefined"
      ? localStorage.getItem("flowrms_refresh_token")
      : null;

  console.log('FlowScan Apollo authLink: Operation:', operation.operationName, 'Token available:', !!token, 'Refresh token available:', !!refreshToken);

  // Only send headers if we have localStorage tokens (legacy support)
  // Otherwise, the /api/graphql proxy will use cookies automatically
  if (token || refreshToken) {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(refreshToken ? { 'Refresh-Token': refreshToken } : {}),
      },
    }));
  }

  return forward(operation);
});

/**
 * Extract files from a GraphQL operation for multipart upload
 */
function extractFilesFromOperation(obj: unknown, path = ""): { files: Map<unknown, string[]>; clone: unknown } {
  const files = new Map<unknown, string[]>();
  
  function extract(value: unknown, currentPath: string): unknown {
    if (isExtractableFile(value)) {
      files.set(value, [currentPath]);
      return null;
    }
    
    if (Array.isArray(value)) {
      return value.map((item, index) => extract(item, `${currentPath}.${index}`));
    }
    
    if (value !== null && typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        result[key] = extract(val, newPath);
      }
      return result;
    }
    
    return value;
  }
  
  const clone = extract(obj, path);
  return { files, clone };
}

// Upload link to handle file uploads through proxy
const uploadLink = new ApolloLink((operation, forward) => {
  const context = operation.getContext();
  const { query, variables, operationName } = operation;
  
  // Check if this is an upload mutation
  const isUploadMutation = query?.definitions?.some((def: unknown) => {
    const definition = def as { kind?: string; operation?: string; selectionSet?: { selections?: unknown[] } };
    return definition.kind === 'OperationDefinition' && 
      definition.operation === 'mutation' &&
      (operationName === 'SingleFileUpload' || 
       definition.selectionSet?.selections?.some((sel: unknown) => {
         const selection = sel as { name?: { value?: string } };
         return selection.name?.value === 'singleFileUpload';
       })
      );
  });

  console.log('📤 Upload Link - Operation:', operationName, 'isUpload:', isUploadMutation);
  console.log('🔍 Upload Link - Variables:', variables);

  if (isUploadMutation) {
    console.log('📤 Handling upload mutation through proxy');
    
    // Extract files from variables
    const { clone, files } = extractFilesFromOperation({ variables });
    
    console.log('� Extracted files:', files.size);
    
    if (files.size > 0) {
      // Create multipart form data
      const formData = new FormData();
      
      // Add the GraphQL operation
      const operations = {
        query: print(operation.query),
        variables: (clone as { variables?: Record<string, unknown> }).variables,      // must include null where file was
        operationName,
      };
      
      formData.append('operations', JSON.stringify(operations));
      
      // Create the map for file position (single file mapped to variables.file)
      const map: Record<string, string[]> = {
        "0": ["variables.file"]
      };
      formData.append('map', JSON.stringify(map));
      
      // Add the file (only the first file since it's singleFileUpload)
      const fileEntries = Array.from(files.entries());
      if (fileEntries.length > 0) {
        const [file] = fileEntries[0];
        formData.append('0', file as File);
      }
      
      // Return an Observable for the upload
      return new Observable(observer => {
        const uploadUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}${UPLOAD_PROXY_URL}`
          : UPLOAD_PROXY_URL;
        
        const headers: Record<string, string> = {};
        
        // Add auth header if available
        const authHeader = context.headers?.Authorization || context.headers?.authorization;
        if (authHeader) {
          headers.Authorization = authHeader;
        }
        
        // Add refresh token header if available
        const refreshTokenHeader = context.headers?.['Refresh-Token'];
        if (refreshTokenHeader) {
          headers['Refresh-Token'] = refreshTokenHeader;
        }
        
        console.log('📤 Uploading to:', uploadUrl);
        console.log('📤 Headers:', { hasAuth: !!headers.Authorization, hasRefresh: !!headers['Refresh-Token'] });
        
        console.log('📤 Full payload being sent:');
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: File(${value.name}, ${value.size} bytes)`);
          } else {
            console.log(`${key}: ${value}`);
          }
        }
        
        fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          headers,
        })
        .then(response => {
          console.log('📤 Raw response received:', response);
          console.log('📤 Response status:', response.status);
          console.log('📤 Response headers:', Object.fromEntries(response.headers.entries()));
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('✅ Upload successful - Full response:', data);
          console.log('✅ Response structure:', {
            hasData: !!data.data,
            dataKeys: data.data ? Object.keys(data.data) : [],
            hasUploadFile: data.data?.uploadFile !== undefined,
            uploadFileKeys: data.data?.uploadFile ? Object.keys(data.data.uploadFile) : [],
            resultsLength: data.data?.uploadFile?.results?.length || 0
          });
          
          // Ensure the response format matches what Apollo Client expects
          observer.next({
            data: data.data || data, // Handle both {data: {...}} and direct {...} responses
          });
          observer.complete();
        })
        .catch(error => {
          console.error('❌ Upload failed:', error);
          observer.error(error);
        });
      });
    }
  }
  
  // For non-upload operations, continue normally
  return forward(operation);
});

// HTTP link for regular GraphQL operations
const httpLink = createHttpLink({
  uri: FLOWRMS_GRAPHQL_URL,
  credentials: "include",
});

// Create Apollo client for FlowScan API with upload support
export const flowrmsApolloClient = new ApolloClient({
  link: from([errorLink, authLink, uploadLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
});

// Create a separate Apollo client for FlowRMS API (factories, etc.)
// Now uses the same unified v6 API endpoint via proxy
const FLOWRMS_API_PROXY = '/api/flow-ai/graphql';

console.log('🔧 FlowRMS API Apollo Client configured with:');
console.log('🔧 GraphQL URL:', FLOWRMS_API_PROXY, '(unified v6 API via proxy)');

const flowrmsApiHttpLink = createHttpLink({
  uri: FLOWRMS_API_PROXY,
  credentials: "include",
});

export const flowrmsApiApolloClient = new ApolloClient({
  link: from([errorLink, authLink, flowrmsApiHttpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
});

// ============================================
// FlowRMS API Client with WebSocket Support
// For subscriptions like fileUploadProcessStatus
// ============================================

// WebSocket URL for subscriptions - unified v6 API
const getFlowrmsApiWsUrl = (): string => {
  // All WebSocket connections now go to the unified v6 API
  const wsUrl = process.env.NEXT_PUBLIC_FLOWRMS_WS_URL || "wss://staging.v6.api.flowrms.com/graphql";
  return wsUrl;
};

const FLOWRMS_API_WS_URL = getFlowrmsApiWsUrl();

console.log('🔧 FlowRMS API WebSocket Client configured with:');
console.log('🔧 HTTP URL:', FLOWRMS_API_PROXY, '(unified v6 API via proxy)');
console.log('🔧 WebSocket URL:', FLOWRMS_API_WS_URL, '(unified v6 API)');

// Cache for tokens fetched from the API
let cachedTokens: { accessToken: string | null; refreshToken: string | null } | null = null;
let tokenFetchPromise: Promise<{ accessToken: string | null; refreshToken: string | null }> | null = null;

// Fetch tokens from the /api/get-tokens endpoint (since they're in HttpOnly cookies)
async function fetchTokensFromAPI(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  // Return cached tokens if available
  if (cachedTokens) {
    return cachedTokens;
  }

  // If already fetching, return the existing promise
  if (tokenFetchPromise) {
    return tokenFetchPromise;
  }

  tokenFetchPromise = (async () => {
    try {
      console.log('🔑 Fetching tokens from /api/get-tokens for WebSocket connection...');
      const response = await fetch('/api/get-tokens', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn('⚠️ Failed to fetch tokens:', response.status);
        return { accessToken: null, refreshToken: null };
      }

      const data = await response.json();
      cachedTokens = {
        accessToken: data.accessToken || null,
        refreshToken: data.refreshToken || null,
      };

      console.log('✅ Tokens fetched successfully:', {
        hasAccessToken: !!cachedTokens.accessToken,
        hasRefreshToken: !!cachedTokens.refreshToken,
      });

      return cachedTokens;
    } catch (error) {
      console.error('❌ Error fetching tokens:', error);
      return { accessToken: null, refreshToken: null };
    } finally {
      tokenFetchPromise = null;
    }
  })();

  return tokenFetchPromise;
}

// Export function to clear cached tokens (useful when user logs out)
export function clearCachedTokens() {
  cachedTokens = null;
}

// WebSocket link for FlowRMS API subscriptions
// Using graphql-ws which implements the graphql-transport-ws subprotocol
const flowrmsApiWsLink = typeof window !== "undefined" ? new GraphQLWsLink(
  createClient({
    url: FLOWRMS_API_WS_URL,
    // Keep lazy=true so we can fetch tokens before connecting
    lazy: true,
    // Connection acknowledgement timeout
    connectionAckWaitTimeout: 10000,
    // Keep connection alive with ping every 10 seconds
    keepAlive: 10000,
    // Async connectionParams - fetch tokens from API since they're in HttpOnly cookies
    connectionParams: async () => {
      const tokens = await fetchTokensFromAPI();

      console.log('🔌 FlowRMS API WebSocket connectionParams:', {
        hasToken: !!tokens.accessToken,
        hasRefresh: !!tokens.refreshToken,
        url: FLOWRMS_API_WS_URL,
      });

      return {
        Authorization: tokens.accessToken ? `Bearer ${tokens.accessToken}` : '',
        'Refresh-Token': tokens.refreshToken || '',
      };
    },
    // Retry connection on failure
    retryAttempts: 5,
    shouldRetry: () => true,
    on: {
      connecting: () => console.log('🔄 FlowRMS API WebSocket connecting to', FLOWRMS_API_WS_URL),
      connected: (socket) => console.log('✅ FlowRMS API WebSocket connected to', FLOWRMS_API_WS_URL, socket),
      closed: (event) => console.log('🔌 FlowRMS API WebSocket closed:', event),
      error: (error) => {
        console.error('❌ FlowRMS API WebSocket error:', error);
        // Log more details if available
        if (error instanceof Error) {
          console.error('❌ Error message:', error.message);
          console.error('❌ Error stack:', error.stack);
        }
      },
    },
  })
) : null;

// Split between HTTP and WebSocket based on operation type for FlowRMS API
const flowrmsApiSplitLink = typeof window !== "undefined" && flowrmsApiWsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      flowrmsApiWsLink,
      from([errorLink, authLink, flowrmsApiHttpLink])
    )
  : from([errorLink, authLink, flowrmsApiHttpLink]);

// FlowRMS API client with WebSocket subscription support
// Use this client when you need to subscribe to fileUploadProcessStatus
export const flowrmsApiSubscriptionClient = new ApolloClient({
  link: flowrmsApiSplitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
});





