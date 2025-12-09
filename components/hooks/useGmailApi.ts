/**
 * Gmail Integration React Query Hooks
 * Custom hooks for managing Gmail OAuth flow, connection status, and email sending
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getGmailAuthUrl,
  getGmailConnectionStatus,
  connectGmail,
  disconnectGmail,
  sendGmailEmail,
  generateAndStoreGmailOAuthState,
  validateGmailOAuthState,
  clearStoredGmailOAuthState,
  type GmailConnectionStatus,
  type GmailConnectResponse,
  type GmailSendEmailInput,
  type GmailSendEmailResponse,
} from '../lib/gmail-graphql';

// ============================================================================
// Query Keys
// ============================================================================

export const gmailQueryKeys = {
  all: ['gmail'] as const,
  connectionStatus: () => [...gmailQueryKeys.all, 'connectionStatus'] as const,
  authUrl: (state?: string) => [...gmailQueryKeys.all, 'authUrl', state] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to get Gmail connection status
 */
export function useGmailConnectionStatus() {
  return useQuery<GmailConnectionStatus, Error>({
    queryKey: gmailQueryKeys.connectionStatus(),
    queryFn: getGmailConnectionStatus,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to get Gmail auth URL (not automatically fetched)
 */
export function useGmailAuthUrl(state?: string, enabled = false) {
  return useQuery<string, Error>({
    queryKey: gmailQueryKeys.authUrl(state),
    queryFn: () => getGmailAuthUrl(state),
    enabled,
    staleTime: 0,
    gcTime: 0,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to initiate Gmail OAuth flow
 */
export function useGmailStartAuth() {
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      // Generate and store CSRF state
      const state = generateAndStoreGmailOAuthState();

      // Get auth URL from server
      const authUrl = await getGmailAuthUrl(state);

      // Redirect to Google login
      if (typeof window !== 'undefined') {
        window.location.href = authUrl;
      }
    },
  });
}

/**
 * Hook to complete Gmail connection (exchange code for tokens)
 */
export function useGmailConnect() {
  const queryClient = useQueryClient();

  return useMutation<GmailConnectResponse, Error, { code: string; state: string }>({
    mutationFn: async ({ code, state }) => {
      // Validate state for CSRF protection
      if (!validateGmailOAuthState(state)) {
        throw new Error('Invalid OAuth state. Please try connecting again.');
      }

      // Exchange code for tokens
      const result = await connectGmail(code);

      // Clear the stored state after use
      clearStoredGmailOAuthState();

      return result;
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: gmailQueryKeys.connectionStatus() });
      }
    },
  });
}

/**
 * Hook to disconnect from Gmail
 */
export function useGmailDisconnect() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, void>({
    mutationFn: disconnectGmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gmailQueryKeys.connectionStatus() });
    },
  });
}

/**
 * Hook to send email through Gmail
 */
export function useGmailSendEmail() {
  return useMutation<GmailSendEmailResponse, Error, GmailSendEmailInput>({
    mutationFn: sendGmailEmail,
  });
}

// ============================================================================
// Utility Functions for OAuth Callback Handling
// ============================================================================

export interface GmailCallbackParams {
  code?: string | null;
  state?: string | null;
  error?: string | null;
  errorDescription?: string | null;
}

/**
 * Parse OAuth callback parameters from URL
 */
export function parseGmailCallbackParams(): GmailCallbackParams {
  if (typeof window === 'undefined') {
    return {};
  }

  const params = new URLSearchParams(window.location.search);

  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error'),
    errorDescription: params.get('error_description'),
  };
}

/**
 * Check if current URL has Gmail OAuth callback parameters
 */
export function hasGmailCallbackParams(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const provider = params.get('provider');
  return provider === 'gmail' && !!(params.get('code') || params.get('error'));
}

/**
 * Clean OAuth callback parameters from URL
 */
export function cleanGmailCallbackUrl(basePath: string = '/integrations'): void {
  if (typeof window !== 'undefined') {
    window.history.replaceState({}, '', basePath);
  }
}
