/**
 * Email Ingestion GraphQL Client
 * Client for interacting with the Python AI Service GraphQL API
 */

import { getCRMAccessToken } from './crm-auth';
import { isTokenServerEnabled, tokenServerClient } from './crm-token-server';
import {
  getStoredAccessToken as getSSOAccessToken,
  getStoredRefreshToken,
  getValidAccessToken as getValidSSOToken,
  clearTokens as clearSSOTokens,
} from './auth';
import { redirectToLogin } from './redirect';
import type { Email, EmailAttachment, EmailStatusAPI } from '../email-ingestion/types';

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
 * Check if SSO auth tokens are available (from FlowRMS redirect)
 */
function hasSSOTokens(): boolean {
  if (typeof window === 'undefined') return false;
  return !!getSSOAccessToken();
}

/**
 * Execute a GraphQL query/mutation against the Email Ingestion API
 * Uses the same authentication strategy as the CRM API
 */
export async function emailGraphQLRequest<T = unknown>(
  options: GraphQLRequestOptions
): Promise<GraphQLResponse<T>> {
  let authHeader: string;
  let usingSSOAuth = false;

  // Priority 1: Check for SSO tokens (from FlowRMS redirect)
  if (hasSSOTokens()) {
    const ssoToken = await getValidSSOToken();
    if (ssoToken) {
      authHeader = `Bearer ${ssoToken}`;
      usingSSOAuth = true;
    } else {
      // SSO token refresh failed, redirect to login
      if (typeof window !== 'undefined') {
        clearSSOTokens();
        redirectToLogin();
      }
      throw new Error('Authentication expired. Redirecting to login...');
    }
  }
  // Priority 2: Token Server mode
  else if (isTokenServerEnabled()) {
    try {
      authHeader = await tokenServerClient.getAuthorizationHeader();
    } catch (error) {
      throw new Error(
        `Token Server error: ${error instanceof Error ? error.message : 'Failed to get token'}`
      );
    }
  }
  // Priority 3: Manual tokens
  else {
    const accessToken = getCRMAccessToken();
    if (!accessToken) {
      throw new Error(
        'CRM access token not configured. Please set your tokens in FlowCRM Auth settings.'
      );
    }
    authHeader = `Bearer ${accessToken}`;
  }

  const endpoint = getGraphQLEndpoint();

  // Get refresh token for the header
  const refreshToken = getStoredRefreshToken();

  // Build headers with refresh token if available
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: authHeader,
  };

  // Always include refresh token in headers if available
  if (refreshToken) {
    headers['X-Refresh-Token'] = refreshToken;
  }

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
    // If using SSO auth, try to refresh token
    if (usingSSOAuth) {
      const newToken = await getValidSSOToken();
      if (newToken) {
        authHeader = `Bearer ${newToken}`;
        headers['Authorization'] = authHeader;
        const freshRefreshToken = getStoredRefreshToken();
        if (freshRefreshToken) {
          headers['X-Refresh-Token'] = freshRefreshToken;
        }
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
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          clearSSOTokens();
          redirectToLogin();
        }
        throw new Error('Authentication expired. Redirecting to login...');
      }
    }
    // If using Token Server, try refreshing
    else if (isTokenServerEnabled()) {
      try {
        authHeader = await tokenServerClient.getAuthorizationHeader(true); // Force refresh
        headers['Authorization'] = authHeader;

        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query: options.query,
            variables: options.variables,
            operationName: options.operationName,
          }),
        });
      } catch {
        throw new Error('Authentication failed. Please check your Token Server configuration.');
      }
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
