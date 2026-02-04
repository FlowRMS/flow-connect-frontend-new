/**
 * Submittals Query Hooks
 * React Query hooks for reading submittals data
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchSubmittal,
  fetchSubmittalsByQuote,
  fetchSubmittalsByJob,
  searchSubmittals,
  type SubmittalResponse,
  type SubmittalStatusGQL,
} from '@/components/lib/graphql/submittals';

// ============================================================================
// Query Keys
// ============================================================================

export const submittalQueryKeys = {
  all: ['submittals'] as const,
  list: () => [...submittalQueryKeys.all, 'list'] as const,
  byQuote: (quoteId: string) =>
    [...submittalQueryKeys.all, 'byQuote', { quoteId }] as const,
  byJob: (jobId: string) =>
    [...submittalQueryKeys.all, 'byJob', { jobId }] as const,
  search: (params: { searchTerm?: string; status?: SubmittalStatusGQL; limit?: number }) =>
    [...submittalQueryKeys.all, 'search', params] as const,
  detail: (id: string) => [...submittalQueryKeys.all, 'detail', id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch a single submittal by ID
 */
export function useSubmittal(id: string | null) {
  return useQuery<SubmittalResponse | null, Error>({
    queryKey: submittalQueryKeys.detail(id || ''),
    queryFn: () => fetchSubmittal(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch submittals by quote
 */
export function useSubmittalsByQuote(quoteId: string | null) {
  return useQuery<SubmittalResponse[], Error>({
    queryKey: submittalQueryKeys.byQuote(quoteId || ''),
    queryFn: () => fetchSubmittalsByQuote(quoteId!),
    enabled: !!quoteId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch submittals by job
 */
export function useSubmittalsByJob(jobId: string | null) {
  return useQuery<SubmittalResponse[], Error>({
    queryKey: submittalQueryKeys.byJob(jobId || ''),
    queryFn: () => fetchSubmittalsByJob(jobId!),
    enabled: !!jobId,
    staleTime: 30 * 1000,
  });
}

/**
 * Search submittals with filters
 */
export function useSubmittalSearch(params: {
  searchTerm?: string;
  status?: SubmittalStatusGQL;
  limit?: number;
}, enabled: boolean = true) {
  return useQuery<SubmittalResponse[], Error>({
    queryKey: submittalQueryKeys.search(params),
    queryFn: () => searchSubmittals(params),
    enabled,
    staleTime: 30 * 1000,
  });
}
