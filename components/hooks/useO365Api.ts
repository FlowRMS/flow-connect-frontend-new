/**
 * Microsoft 365 (O365) Integration React Query Hooks
 * Custom hooks for managing O365 OAuth flow, connection status, and email sending
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getO365AuthUrl,
  getO365ConnectionStatus,
  connectO365,
  disconnectO365,
  sendO365Email,
  generateAndStoreOAuthState,
  validateOAuthState,
  clearStoredOAuthState,
  type O365ConnectionStatus,
  type O365ConnectResponse,
  type O365SendEmailInput,
  type O365SendEmailResponse,
} from '../lib/o365-graphql';

// ============================================================================
// Query Keys
// ============================================================================

export const o365QueryKeys = {
  all: ['o365'] as const,
  connectionStatus: () => [...o365QueryKeys.all, 'connectionStatus'] as const,
  authUrl: (state?: string) => [...o365QueryKeys.all, 'authUrl', state] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to get O365 connection status
 */
export function useO365ConnectionStatus() {
  return useQuery<O365ConnectionStatus, Error>({
    queryKey: o365QueryKeys.connectionStatus(),
    queryFn: getO365ConnectionStatus,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to get O365 auth URL (not automatically fetched)
 * This is used manually when user clicks "Connect"
 */
export function useO365AuthUrl(state?: string, enabled = false) {
  return useQuery<string, Error>({
    queryKey: o365QueryKeys.authUrl(state),
    queryFn: () => getO365AuthUrl(state),
    enabled,
    staleTime: 0, // Always fetch fresh URL
    gcTime: 0, // Don't cache
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to initiate O365 OAuth flow
 * Generates state, gets auth URL, and redirects to Microsoft login
 */
export function useO365StartAuth() {
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      // Generate and store CSRF state
      const state = generateAndStoreOAuthState();

      // Get auth URL from server
      const authUrl = await getO365AuthUrl(state);

      // Redirect to Microsoft login
      if (typeof window !== 'undefined') {
        window.location.href = authUrl;
      }
    },
  });
}

/**
 * Hook to complete O365 connection (exchange code for tokens)
 */
export function useO365Connect() {
  const queryClient = useQueryClient();

  return useMutation<O365ConnectResponse, Error, { code: string; state: string }>({
    mutationFn: async ({ code, state }) => {
      // Validate state for CSRF protection
      if (!validateOAuthState(state)) {
        throw new Error('Invalid OAuth state. Please try connecting again.');
      }

      // Exchange code for tokens
      const result = await connectO365(code);

      // Clear the stored state after use
      clearStoredOAuthState();

      return result;
    },
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate connection status to trigger refetch
        queryClient.invalidateQueries({ queryKey: o365QueryKeys.connectionStatus() });
      }
    },
  });
}

/**
 * Hook to disconnect from O365
 */
export function useO365Disconnect() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, void>({
    mutationFn: disconnectO365,
    onSuccess: () => {
      // Invalidate connection status to trigger refetch
      queryClient.invalidateQueries({ queryKey: o365QueryKeys.connectionStatus() });
    },
  });
}

/**
 * Hook to send email through O365
 */
export function useO365SendEmail() {
  return useMutation<O365SendEmailResponse, Error, O365SendEmailInput>({
    mutationFn: sendO365Email,
  });
}

// ============================================================================
// Utility Hook for OAuth Callback Handling
// ============================================================================

export interface O365CallbackParams {
  code?: string | null;
  state?: string | null;
  error?: string | null;
  errorDescription?: string | null;
}

/**
 * Parse OAuth callback parameters from URL
 */
export function parseO365CallbackParams(): O365CallbackParams {
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
 * Check if current URL has O365 OAuth callback parameters
 */
export function hasO365CallbackParams(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const provider = params.get('provider');
  // Only return true if provider is o365 or not set (for backwards compatibility)
  return (provider === 'o365' || !provider) && !!(params.get('code') || params.get('error'));
}

/**
 * Clean OAuth callback parameters from URL
 * @param basePath - The base path to navigate to after cleaning (e.g., '/integrations')
 */
export function cleanO365CallbackUrl(basePath: string = '/integrations'): void {
  if (typeof window !== 'undefined') {
    window.history.replaceState({}, '', basePath);
  }
}
