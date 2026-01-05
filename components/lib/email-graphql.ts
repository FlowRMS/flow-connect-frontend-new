/**
 * Email Ingestion GraphQL Client
 * Client for interacting with the Python AI Service GraphQL API
 * Uses WorkOS AuthKit for authentication
 */

import type { Email, EmailAttachment, EmailStatusAPI } from '../email-ingestion/types';

// ============================================================================
// WorkOS Token Management
// ============================================================================

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

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
      return null;
    }
    const data = await response.json();
    cachedToken = data.accessToken;
    // Cache for 5 minutes
    tokenExpiry = Date.now() + 5 * 60 * 1000;
    return cachedToken;
  } catch {
    cachedToken = null;
    return null;
  }
}

/**
 * Clear token cache (call on sign out)
 */
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

// Input types for mutations
export interface UpdateEmailStatusInput {
  emailId: string;
  status: EmailStatusAPI;
}

// ============================================================================
// GraphQL Queries and Mutations
// ============================================================================

const GET_EMAILS = `
  query GetEmails($status: EmailStatusEnum, $limit: Int, $offset: Int) {
    getEmails(status: $status, limit: $limit, offset: $offset) {
      id
      externalId
      conversationId
      fromEmail
      toEmail
      subject
      body
      status
      userId
      createdAt
      summary
      category
      sentiment
      urgency
      requiresResponse
      classificationConfidence
      extractedEntities
      suggestedActions
      attachments {
        id
        emailId
        name
        contentType
        size
        s3Key
        createdAt
        documentType
        documentDescription
        classificationConfidence
        extractedMetadata
      }
    }
  }
`;

const GET_EMAIL = `
  query GetEmail($emailId: String!) {
    getEmail(emailId: $emailId) {
      id
      externalId
      conversationId
      fromEmail
      toEmail
      subject
      body
      status
      userId
      createdAt
      summary
      category
      sentiment
      urgency
      requiresResponse
      classificationConfidence
      extractedEntities
      suggestedActions
      attachments {
        id
        emailId
        name
        contentType
        size
        s3Key
        createdAt
        documentType
        documentDescription
        classificationConfidence
        extractedMetadata
      }
    }
  }
`;

const UPDATE_EMAIL_STATUS = `
  mutation UpdateEmailStatus($input: UpdateEmailStatusInput!) {
    updateEmailStatus(input: $input) {
      id
      externalId
      conversationId
      fromEmail
      toEmail
      subject
      body
      status
      userId
      createdAt
      summary
      category
      sentiment
      urgency
      requiresResponse
      classificationConfidence
      extractedEntities
      suggestedActions
      attachments {
        id
        emailId
        name
        contentType
        size
        s3Key
        createdAt
        documentType
        documentDescription
        classificationConfidence
        extractedMetadata
      }
    }
  }
`;

const DELETE_EMAIL = `
  mutation DeleteEmail($emailId: String!) {
    deleteEmail(emailId: $emailId)
  }
`;

const DELETE_EMAIL_ATTACHMENT = `
  mutation DeleteEmailAttachment($attachmentId: String!) {
    deleteEmailAttachment(attachmentId: $attachmentId)
  }
`;

// ============================================================================
// Core GraphQL Request Function
// ============================================================================

/**
 * Execute a GraphQL query/mutation against the Email Ingestion API
 * Uses WorkOS AuthKit for authentication
 */
export async function emailGraphQLRequest<T = unknown>(
  options: GraphQLRequestOptions
): Promise<GraphQLResponse<T>> {
  // Get access token from WorkOS
  const accessToken = await getAccessToken();

  if (!accessToken) {
    // Redirect to auth-error to avoid loops
    if (typeof window !== 'undefined') {
      window.location.href = '/auth-error';
    }
    throw new Error('Authentication failed. Please clear your cookies and try again.');
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
    throw new Error(`Email API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// ============================================================================
// API Functions - Email Queries
// ============================================================================

export interface EmailPaginationInput {
  limit?: number;
  offset?: number;
}

export interface EmailPaginatedResult {
  emails: Email[];
  total: number;
  hasMore: boolean;
}

/**
 * Fetch emails with optional status filter and pagination
 */
export async function fetchEmails(
  status?: EmailStatusAPI,
  pagination?: EmailPaginationInput
): Promise<Email[]> {
  const response = await emailGraphQLRequest<{ getEmails: Email[] }>({
    query: GET_EMAILS,
    variables: {
      status,
      limit: pagination?.limit,
      offset: pagination?.offset,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch emails');
  }

  return response.data?.getEmails || [];
}

/**
 * Fetch paginated emails for infinite scroll
 */
export async function fetchEmailsPaginated(
  status?: EmailStatusAPI,
  pagination?: EmailPaginationInput
): Promise<EmailPaginatedResult> {
  const emails = await fetchEmails(status, pagination);
  const limit = pagination?.limit || 10;

  return {
    emails,
    total: emails.length,
    hasMore: emails.length === limit,
  };
}

/**
 * Fetch single email by ID
 */
export async function fetchEmail(emailId: string): Promise<Email | null> {
  const response = await emailGraphQLRequest<{ getEmail: Email }>({
    query: GET_EMAIL,
    variables: { emailId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch email');
  }

  return response.data?.getEmail || null;
}

// ============================================================================
// API Functions - Email Mutations
// ============================================================================

/**
 * Update email status
 */
export async function updateEmailStatus(input: UpdateEmailStatusInput): Promise<Email> {
  const response = await emailGraphQLRequest<{ updateEmailStatus: Email }>({
    query: UPDATE_EMAIL_STATUS,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update email status');
  }

  if (!response.data?.updateEmailStatus) {
    throw new Error('No email returned from update mutation');
  }

  return response.data.updateEmailStatus;
}

/**
 * Delete email
 */
export async function deleteEmail(emailId: string): Promise<boolean> {
  const response = await emailGraphQLRequest<{ deleteEmail: boolean }>({
    query: DELETE_EMAIL,
    variables: { emailId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete email');
  }

  return response.data?.deleteEmail || false;
}

/**
 * Delete email attachment
 */
export async function deleteEmailAttachment(attachmentId: string): Promise<boolean> {
  const response = await emailGraphQLRequest<{ deleteEmailAttachment: boolean }>({
    query: DELETE_EMAIL_ATTACHMENT,
    variables: { attachmentId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete attachment');
  }

  return response.data?.deleteEmailAttachment || false;
}
