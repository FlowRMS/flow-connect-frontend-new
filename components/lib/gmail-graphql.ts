/**
 * Gmail Integration GraphQL Client
 * Handles OAuth flow, connection status, and email sending through Gmail
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

// Gmail Connection Status Type
export interface GmailConnectionStatus {
  isConnected: boolean;
  googleEmail: string | null;
  expiresAt: string | null;
  lastUsedAt: string | null;
}

// Gmail Connect Response Type
export interface GmailConnectResponse {
  success: boolean;
  googleEmail: string | null;
  error: string | null;
}

// Gmail Send Email Input Type
export interface GmailSendEmailInput {
  to: string[];
  subject: string;
  body: string;
  bodyType?: 'HTML' | 'Text';
  cc?: string[];
  bcc?: string[];
}

// Gmail Send Email Response Type
export interface GmailSendEmailResponse {
  success: boolean;
  messageId: string | null;
  error: string | null;
}

// ============================================================================
// GraphQL Queries & Mutations
// ============================================================================

// Query: Get Gmail Authorization URL
const GET_GMAIL_AUTH_URL = `
  query GetGmailAuthUrl($state: String) {
    gmailAuthUrl(state: $state)
  }
`;

// Query: Get Gmail Connection Status
const GET_GMAIL_CONNECTION_STATUS = `
  query GetGmailConnectionStatus {
    gmailConnectionStatus {
      isConnected
      googleEmail
      expiresAt
      lastUsedAt
    }
  }
`;

// Mutation: Connect Gmail (Exchange Code for Token)
const GMAIL_CONNECT = `
  mutation GmailConnect($code: String!) {
    gmailConnect(code: $code) {
      success
      googleEmail
      error
    }
  }
`;

// Mutation: Disconnect Gmail
const GMAIL_DISCONNECT = `
  mutation GmailDisconnect {
    gmailDisconnect
  }
`;

// Mutation: Send Email via Gmail
const GMAIL_SEND_EMAIL = `
  mutation GmailSendEmail($input: GmailSendEmailInput!) {
    gmailSendEmail(input: $input) {
      success
      messageId
      error
    }
  }
`;

// ============================================================================
// GraphQL Request Function
// ============================================================================

async function gmailGraphQLRequest<T>(
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
    throw new Error(`Gmail API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get the Google OAuth authorization URL
 * @param state - Optional CSRF state token
 */
export async function getGmailAuthUrl(state?: string): Promise<string> {
  const response = await gmailGraphQLRequest<{ gmailAuthUrl: string }>({
    query: GET_GMAIL_AUTH_URL,
    variables: { state },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to get Gmail auth URL');
  }

  if (!response.data?.gmailAuthUrl) {
    throw new Error('No auth URL returned from server');
  }

  return response.data.gmailAuthUrl;
}

/**
 * Get the current Gmail connection status
 */
export async function getGmailConnectionStatus(): Promise<GmailConnectionStatus> {
  const response = await gmailGraphQLRequest<{ gmailConnectionStatus: GmailConnectionStatus }>({
    query: GET_GMAIL_CONNECTION_STATUS,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to get Gmail connection status');
  }

  return response.data?.gmailConnectionStatus || {
    isConnected: false,
    googleEmail: null,
    expiresAt: null,
    lastUsedAt: null,
  };
}

/**
 * Connect to Gmail by exchanging the authorization code for tokens
 * @param code - The authorization code from Google OAuth callback
 */
export async function connectGmail(code: string): Promise<GmailConnectResponse> {
  const response = await gmailGraphQLRequest<{ gmailConnect: GmailConnectResponse }>({
    query: GMAIL_CONNECT,
    variables: { code },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to connect Gmail');
  }

  return response.data?.gmailConnect || {
    success: false,
    googleEmail: null,
    error: 'No response from server',
  };
}

/**
 * Disconnect from Gmail (remove stored tokens)
 */
export async function disconnectGmail(): Promise<boolean> {
  const response = await gmailGraphQLRequest<{ gmailDisconnect: boolean }>({
    query: GMAIL_DISCONNECT,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to disconnect Gmail');
  }

  return response.data?.gmailDisconnect || false;
}

/**
 * Send an email through Gmail
 * @param input - Email details (to, subject, body, etc.)
 */
export async function sendGmailEmail(input: GmailSendEmailInput): Promise<GmailSendEmailResponse> {
  const response = await gmailGraphQLRequest<{ gmailSendEmail: GmailSendEmailResponse }>({
    query: GMAIL_SEND_EMAIL,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to send email');
  }

  return response.data?.gmailSendEmail || {
    success: false,
    messageId: null,
    error: 'No response from server',
  };
}

// ============================================================================
// OAuth State Management (Session Storage)
// ============================================================================

const GMAIL_OAUTH_STATE_KEY = 'gmail_oauth_state';

/**
 * Generate and store a random state for CSRF protection
 */
export function generateAndStoreGmailOAuthState(): string {
  const state = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Date.now().toString(36);

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(GMAIL_OAUTH_STATE_KEY, state);
  }

  return state;
}

/**
 * Get the stored OAuth state
 */
export function getStoredGmailOAuthState(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(GMAIL_OAUTH_STATE_KEY);
}

/**
 * Clear the stored OAuth state
 */
export function clearStoredGmailOAuthState(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(GMAIL_OAUTH_STATE_KEY);
}

/**
 * Validate the OAuth state from the callback URL
 * @param state - The state parameter from the callback URL
 */
export function validateGmailOAuthState(state: string): boolean {
  const storedState = getStoredGmailOAuthState();
  return storedState !== null && storedState === state;
}
