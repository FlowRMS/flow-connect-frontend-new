/**
 * Submittals API React Query Hooks
 * Provides hooks for fetching and mutating submittals data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSubmittal,
  fetchSubmittalsByQuote,
  fetchSubmittalsByJob,
  searchSubmittals,
  createSubmittal,
  updateSubmittal,
  deleteSubmittal,
  addSubmittalItem,
  updateSubmittalItem,
  removeSubmittalItem,
  addSubmittalStakeholder,
  removeSubmittalStakeholder,
  createSubmittalRevision,
  sendSubmittalEmail,
  generateSubmittalPdf,
  addReturnedPdf,
  addChangeAnalysis,
  updateItemChange,
  deleteItemChange,
  resolveItemChange,
  type SubmittalResponse,
  type SubmittalItemResponse,
  type SubmittalStakeholderResponse,
  type SubmittalRevisionResponse,
  type SubmittalReturnedPdfResponse,
  type SubmittalChangeAnalysisResponse,
  type SubmittalItemChangeResponse,
  type CreateSubmittalInput,
  type UpdateSubmittalInput,
  type SubmittalItemInput,
  type UpdateSubmittalItemInput,
  type SubmittalStakeholderInput,
  type SendSubmittalEmailInput,
  type SendSubmittalEmailResponse,
  type GenerateSubmittalPdfInput,
  type GenerateSubmittalPdfResponse,
  type AddReturnedPdfInput,
  type AddChangeAnalysisInput,
  type UpdateItemChangeInput,
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

// ============================================================================
// Mutation Hooks - Submittal CRUD
// ============================================================================

/**
 * Create a new submittal
 */
export function useCreateSubmittal() {
  const queryClient = useQueryClient();

  return useMutation<SubmittalResponse, Error, CreateSubmittalInput>({
    mutationFn: createSubmittal,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.all });
      if (data.quoteId) {
        queryClient.invalidateQueries({ queryKey: submittalQueryKeys.byQuote(data.quoteId) });
      }
      if (data.jobId) {
        queryClient.invalidateQueries({ queryKey: submittalQueryKeys.byJob(data.jobId) });
      }
    },
  });
}

/**
 * Update an existing submittal
 */
export function useUpdateSubmittal() {
  const queryClient = useQueryClient();

  return useMutation<SubmittalResponse, Error, { id: string; input: UpdateSubmittalInput }>({
    mutationFn: ({ id, input }) => updateSubmittal(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.detail(data.id) });
    },
  });
}

/**
 * Delete a submittal
 */
export function useDeleteSubmittal() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteSubmittal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.all });
    },
  });
}

// ============================================================================
// Mutation Hooks - Submittal Items
// ============================================================================

/**
 * Add an item to a submittal
 */
export function useAddSubmittalItem() {
  const queryClient = useQueryClient();

  return useMutation<SubmittalItemResponse, Error, { submittalId: string; input: SubmittalItemInput }>({
    mutationFn: ({ submittalId, input }) => addSubmittalItem(submittalId, input),
    onSuccess: (_, { submittalId }) => {
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.detail(submittalId) });
    },
  });
}

/**
 * Update a submittal item
 */
export function useUpdateSubmittalItem() {
  const queryClient = useQueryClient();

  return useMutation<SubmittalItemResponse, Error, { id: string; input: UpdateSubmittalItemInput; submittalId: string }>({
    mutationFn: ({ id, input }) => updateSubmittalItem(id, input),
    onSuccess: () => {
      // Invalidate all submittal queries to refresh the list and detail views
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.all });
    },
  });
}

/**
 * Remove an item from a submittal
 */
export function useRemoveSubmittalItem() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { id: string; submittalId: string }>({
    mutationFn: ({ id }) => removeSubmittalItem(id),
    onSuccess: (_, { submittalId }) => {
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.detail(submittalId) });
    },
  });
}

// ============================================================================
// Mutation Hooks - Stakeholders
// ============================================================================

/**
 * Add a stakeholder to a submittal
 */
export function useAddSubmittalStakeholder() {
  const queryClient = useQueryClient();

  return useMutation<SubmittalStakeholderResponse, Error, { submittalId: string; input: SubmittalStakeholderInput }>({
    mutationFn: ({ submittalId, input }) => addSubmittalStakeholder(submittalId, input),
    onSuccess: (_, { submittalId }) => {
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.detail(submittalId) });
    },
  });
}

/**
 * Remove a stakeholder from a submittal
 */
export function useRemoveSubmittalStakeholder() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { id: string; submittalId: string }>({
    mutationFn: ({ id }) => removeSubmittalStakeholder(id),
    onSuccess: (_, { submittalId }) => {
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.detail(submittalId) });
    },
  });
}

// ============================================================================
// Mutation Hooks - Revisions & Email
// ============================================================================

/**
 * Create a new revision for a submittal
 */
export function useCreateSubmittalRevision() {
  const queryClient = useQueryClient();

  return useMutation<SubmittalRevisionResponse, Error, { submittalId: string; notes?: string }>({
    mutationFn: ({ submittalId, notes }) => createSubmittalRevision(submittalId, notes),
    onSuccess: (_, { submittalId }) => {
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.detail(submittalId) });
    },
  });
}

/**
 * Send a submittal email
 */
export function useSendSubmittalEmail() {
  const queryClient = useQueryClient();

  return useMutation<SendSubmittalEmailResponse, Error, SendSubmittalEmailInput>({
    mutationFn: sendSubmittalEmail,
    onSuccess: (_, { submittalId }) => {
      // Invalidate all submittal queries (including search) to refresh revision data
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.detail(submittalId) });
    },
  });
}

// ============================================================================
// Mutation Hooks - PDF Generation
// ============================================================================

/**
 * Generate a submittal PDF
 */
export function useGenerateSubmittalPdf() {
  const queryClient = useQueryClient();

  return useMutation<GenerateSubmittalPdfResponse, Error, GenerateSubmittalPdfInput>({
    mutationFn: generateSubmittalPdf,
    onSuccess: (_, { submittalId }) => {
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.detail(submittalId) });
    },
  });
}

// ============================================================================
// Mutation Hooks - Returned PDFs & Change Analysis
// ============================================================================

/**
 * Add a returned PDF to a revision
 */
export function useAddReturnedPdf() {
  const queryClient = useQueryClient();

  return useMutation<SubmittalReturnedPdfResponse, Error, { submittalId: string; input: AddReturnedPdfInput }>({
    mutationFn: ({ input }) => addReturnedPdf(input),
    onSuccess: (_, { submittalId }) => {
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.detail(submittalId) });
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.all });
    },
  });
}

/**
 * Add a change analysis to a returned PDF
 */
export function useAddChangeAnalysis() {
  const queryClient = useQueryClient();

  return useMutation<SubmittalChangeAnalysisResponse, Error, { submittalId: string; input: AddChangeAnalysisInput }>({
    mutationFn: ({ input }) => addChangeAnalysis(input),
    onSuccess: (_, { submittalId }) => {
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.detail(submittalId) });
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.all });
    },
  });
}

// ============================================================================
// Mutation Hooks - Item Changes
// ============================================================================

/**
 * Update an item change in a change analysis
 */
export function useUpdateItemChange() {
  const queryClient = useQueryClient();

  return useMutation<SubmittalItemChangeResponse, Error, { id: string; input: UpdateItemChangeInput; submittalId: string }>({
    mutationFn: ({ id, input }) => updateItemChange(id, input),
    onSuccess: (_, { submittalId }) => {
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.detail(submittalId) });
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.all });
    },
  });
}

/**
 * Delete an item change from a change analysis
 */
export function useDeleteItemChange() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { id: string; submittalId: string }>({
    mutationFn: ({ id }) => deleteItemChange(id),
    onSuccess: (_, { submittalId }) => {
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.detail(submittalId) });
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.all });
    },
  });
}

/**
 * Mark an item change as resolved
 */
export function useResolveItemChange() {
  const queryClient = useQueryClient();

  return useMutation<SubmittalItemChangeResponse, Error, { id: string; submittalId: string }>({
    mutationFn: ({ id }) => resolveItemChange(id),
    onSuccess: (_, { submittalId }) => {
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.detail(submittalId) });
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.all });
    },
  });
}

// ============================================================================
// Re-export types
// ============================================================================

export type {
  SubmittalResponse,
  SubmittalItemResponse,
  SubmittalStakeholderResponse,
  SubmittalRevisionResponse,
  SubmittalReturnedPdfResponse,
  SubmittalChangeAnalysisResponse,
  SubmittalItemChangeResponse,
  CreateSubmittalInput,
  UpdateSubmittalInput,
  SubmittalItemInput,
  UpdateSubmittalItemInput,
  SubmittalStakeholderInput,
  SendSubmittalEmailInput,
  SendSubmittalEmailResponse,
  GenerateSubmittalPdfInput,
  GenerateSubmittalPdfResponse,
  AddReturnedPdfInput,
  AddChangeAnalysisInput,
  UpdateItemChangeInput,
  SubmittalStatusGQL,
  SubmittalItemApprovalStatusGQL,
  SubmittalItemMatchStatusGQL,
  SubmittalStakeholderRoleGQL,
  TransmittalPurposeGQL,
  ChangeAnalysisSourceGQL,
  OverallChangeStatusGQL,
  ItemChangeStatusGQL,
} from '@/components/lib/graphql/submittals';
