/**
 * Microsoft 365 (O365) Integration GraphQL Client
 * Handles OAuth flow, connection status, and email sending through Microsoft 365
 * Uses WorkOS AuthKit for authentication
 */

// ============================================================================
// WorkOS Token Management
// ============================================================================

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

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

function clearTokenCache(): void {
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

// O365 Connection Status Type
export interface O365ConnectionStatus {
  isConnected: boolean;
  microsoftEmail: string | null;
  expiresAt: string | null;
  lastUsedAt: string | null;
}

// O365 Connect Response Type
export interface O365ConnectResponse {
  success: boolean;
  microsoftEmail: string | null;
  error: string | null;
}

// O365 Send Email Input Type
export interface O365SendEmailInput {
  to: string[];
  subject: string;
  body: string;
  bodyType?: 'HTML' | 'Text';
  cc?: string[];
  bcc?: string[];
}

// O365 Send Email Response Type
export interface O365SendEmailResponse {
  success: boolean;
  messageId: string | null;
  error: string | null;
}

// ============================================================================
// GraphQL Queries & Mutations
// ============================================================================

// Query: Get O365 Authorization URL
const GET_O365_AUTH_URL = `
  query GetO365AuthUrl($state: String) {
    o365AuthUrl(state: $state)
  }
`;

// Query: Get O365 Connection Status
const GET_O365_CONNECTION_STATUS = `
  query GetO365ConnectionStatus {
    o365ConnectionStatus {
      isConnected
      microsoftEmail
      expiresAt
      lastUsedAt
    }
  }
`;

// Mutation: Connect O365 (Exchange Code for Token)
const O365_CONNECT = `
  mutation O365Connect($code: String!) {
    o365Connect(code: $code) {
      success
      microsoftEmail
      error
    }
  }
`;

// Mutation: Disconnect O365
const O365_DISCONNECT = `
  mutation O365Disconnect {
    o365Disconnect
  }
`;

// Mutation: Send Email via O365
const O365_SEND_EMAIL = `
  mutation O365SendEmail($input: O365SendEmailInput!) {
    o365SendEmail(input: $input) {
      success
      messageId
      error
    }
  }
`;

// ============================================================================
// GraphQL Request Function
// ============================================================================

async function o365GraphQLRequest<T>(
  options: GraphQLRequestOptions
): Promise<GraphQLResponse<T>> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    if (typeof window !== 'undefined') {
      window.location.href = '/sign-in';
    }
    throw new Error('Authentication required. Redirecting to sign-in...');
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

  if (response.status === 401 || response.status === 403) {
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
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in';
      }
      throw new Error('Authentication expired. Redirecting to sign-in...');
    }
  }

  if (!response.ok) {
    throw new Error(`O365 API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get the Microsoft OAuth authorization URL
 * @param state - Optional CSRF state token
 */
export async function getO365AuthUrl(state?: string): Promise<string> {
  const response = await o365GraphQLRequest<{ o365AuthUrl: string }>({
    query: GET_O365_AUTH_URL,
    variables: { state },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to get O365 auth URL');
  }

  if (!response.data?.o365AuthUrl) {
    throw new Error('No auth URL returned from server');
  }

  return response.data.o365AuthUrl;
}

/**
 * Get the current O365 connection status
 */
export async function getO365ConnectionStatus(): Promise<O365ConnectionStatus> {
  const response = await o365GraphQLRequest<{ o365ConnectionStatus: O365ConnectionStatus }>({
    query: GET_O365_CONNECTION_STATUS,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to get O365 connection status');
  }

  return response.data?.o365ConnectionStatus || {
    isConnected: false,
    microsoftEmail: null,
    expiresAt: null,
    lastUsedAt: null,
  };
}

/**
 * Connect to O365 by exchanging the authorization code for tokens
 * @param code - The authorization code from Microsoft OAuth callback
 */
export async function connectO365(code: string): Promise<O365ConnectResponse> {
  const response = await o365GraphQLRequest<{ o365Connect: O365ConnectResponse }>({
    query: O365_CONNECT,
    variables: { code },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to connect O365');
  }

  return response.data?.o365Connect || {
    success: false,
    microsoftEmail: null,
    error: 'No response from server',
  };
}

/**
 * Disconnect from O365 (remove stored tokens)
 */
export async function disconnectO365(): Promise<boolean> {
  const response = await o365GraphQLRequest<{ o365Disconnect: boolean }>({
    query: O365_DISCONNECT,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to disconnect O365');
  }

  return response.data?.o365Disconnect || false;
}

/**
 * Send an email through O365
 * @param input - Email details (to, subject, body, etc.)
 */
export async function sendO365Email(input: O365SendEmailInput): Promise<O365SendEmailResponse> {
  const response = await o365GraphQLRequest<{ o365SendEmail: O365SendEmailResponse }>({
    query: O365_SEND_EMAIL,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to send email');
  }

  return response.data?.o365SendEmail || {
    success: false,
    messageId: null,
    error: 'No response from server',
  };
}

// ============================================================================
// OAuth State Management (Session Storage)
// ============================================================================

const O365_OAUTH_STATE_KEY = 'o365_oauth_state';

/**
 * Generate and store a random state for CSRF protection
 */
export function generateAndStoreOAuthState(): string {
  // Generate a random state using crypto.randomUUID if available
  const state = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Date.now().toString(36);

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(O365_OAUTH_STATE_KEY, state);
  }

  return state;
}

/**
 * Get the stored OAuth state
 */
export function getStoredOAuthState(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(O365_OAUTH_STATE_KEY);
}

/**
 * Clear the stored OAuth state
 */
export function clearStoredOAuthState(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(O365_OAUTH_STATE_KEY);
}

/**
 * Validate the OAuth state from the callback URL
 * @param state - The state parameter from the callback URL
 */
export function validateOAuthState(state: string): boolean {
  const storedState = getStoredOAuthState();
  return storedState !== null && storedState === state;
}
