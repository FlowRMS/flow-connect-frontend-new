/**
 * Email Ingestion React Query Hooks
 * Custom hooks for interacting with the Email Ingestion GraphQL API
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

import {
  fetchEmails,
  fetchEmail,
  fetchEmailsPaginated,
  updateEmailStatus,
  deleteEmail,
  deleteEmailAttachment,
  type UpdateEmailStatusInput,
  type EmailPaginatedResult,
} from '../lib/email-graphql';
import type { Email, EmailStatusAPI } from '../email-ingestion/types';

// ============================================================================
// Query Keys
// ============================================================================

const PAGE_SIZE = 10;

export const emailQueryKeys = {
  all: ['emails'] as const,
  list: (status?: EmailStatusAPI) => [...emailQueryKeys.all, 'list', { status }] as const,
  infinite: (status?: EmailStatusAPI) => [...emailQueryKeys.all, 'infinite', { status }] as const,
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
    enabled: true,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch emails with infinite scroll pagination
 */
export function useEmailsInfinite(status?: EmailStatusAPI) {
  const query = useInfiniteQuery<EmailPaginatedResult, Error>({
    queryKey: emailQueryKeys.infinite(status),
    queryFn: async ({ pageParam = 0 }) => {
      return fetchEmailsPaginated(status, {
        limit: PAGE_SIZE,
        offset: pageParam as number,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    enabled: true,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  // Combine all pages into a single array with deduplication
  const emails: Email[] = query.data
    ? deduplicateById(query.data.pages.flatMap(page => page.emails))
    : [];

  return {
    emails,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

/**
 * Helper to deduplicate records by ID
 */
function deduplicateById<T extends { id: string }>(records: T[]): T[] {
  const seen = new Set<string>();
  return records.filter(record => {
    if (seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });
}

/**
 * Fetch single email by ID
 */
export function useEmail(emailId: string) {
  return useQuery<Email | null, Error>({
    queryKey: emailQueryKeys.detail(emailId),
    queryFn: () => fetchEmail(emailId),
    enabled: !!emailId,
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
