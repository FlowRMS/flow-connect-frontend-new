/**
 * Email Ingestion React Query Hooks
 * Custom hooks for interacting with the Email Ingestion GraphQL API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hasCRMTokens } from '../lib/crm-auth';
import {
  fetchEmails,
  fetchEmail,
  updateEmailStatus,
  deleteEmail,
  deleteEmailAttachment,
  type UpdateEmailStatusInput,
} from '../lib/email-graphql';
import type { Email, EmailStatusAPI } from '../email-ingestion/types';

// ============================================================================
// Query Keys
// ============================================================================

export const emailQueryKeys = {
  all: ['emails'] as const,
  list: (status?: EmailStatusAPI) => [...emailQueryKeys.all, 'list', { status }] as const,
  detail: (id: string) => [...emailQueryKeys.all, 'detail', id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all emails or filter by status
 */
export function useEmails(status?: EmailStatusAPI) {
  return useQuery<Email[], Error>({
    queryKey: emailQueryKeys.list(status),
    queryFn: () => fetchEmails(status),
    enabled: hasCRMTokens(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch single email by ID
 */
export function useEmail(emailId: string) {
  return useQuery<Email | null, Error>({
    queryKey: emailQueryKeys.detail(emailId),
    queryFn: () => fetchEmail(emailId),
    enabled: hasCRMTokens() && !!emailId,
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Update email status mutation
 */
export function useUpdateEmailStatus() {
  const queryClient = useQueryClient();

  return useMutation<Email, Error, UpdateEmailStatusInput>({
    mutationFn: updateEmailStatus,
    onSuccess: (data) => {
      // Invalidate all email lists to refetch with updated status
      queryClient.invalidateQueries({ queryKey: emailQueryKeys.all });
      // Update the specific email in cache
      queryClient.setQueryData(emailQueryKeys.detail(data.id), data);
    },
  });
}

/**
 * Delete email mutation
 */
export function useDeleteEmail() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteEmail,
    onSuccess: () => {
      // Invalidate all email lists to refetch without deleted email
      queryClient.invalidateQueries({ queryKey: emailQueryKeys.all });
    },
  });
}

/**
 * Delete email attachment mutation
 */
export function useDeleteEmailAttachment() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { attachmentId: string; emailId: string }>({
    mutationFn: ({ attachmentId }) => deleteEmailAttachment(attachmentId),
    onSuccess: (_, variables) => {
      // Invalidate the specific email to refetch without deleted attachment
      queryClient.invalidateQueries({ queryKey: emailQueryKeys.detail(variables.emailId) });
      // Also invalidate all lists in case attachment counts are shown
      queryClient.invalidateQueries({ queryKey: emailQueryKeys.all });
    },
  });
}
