/**
 * Submittals Mutation Hooks
 * React Query hooks for mutating submittals data
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
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
} from '@/components/lib/graphql/submittals';
import { submittalQueryKeys } from './useSubmittalsQueries';

// ============================================================================
// Submittal CRUD Mutations
// ============================================================================

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
// Item Mutations
// ============================================================================

export function useAddSubmittalItem() {
  const queryClient = useQueryClient();

  return useMutation<SubmittalItemResponse, Error, { submittalId: string; input: SubmittalItemInput }>({
    mutationFn: ({ submittalId, input }) => addSubmittalItem(submittalId, input),
    onSuccess: (_, { submittalId }) => {
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.detail(submittalId) });
    },
  });
}

export function useUpdateSubmittalItem() {
  const queryClient = useQueryClient();

  return useMutation<SubmittalItemResponse, Error, { id: string; input: UpdateSubmittalItemInput; submittalId: string }>({
    mutationFn: ({ id, input }) => updateSubmittalItem(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.all });
    },
  });
}

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
// Stakeholder Mutations
// ============================================================================

export function useAddSubmittalStakeholder() {
  const queryClient = useQueryClient();

  return useMutation<SubmittalStakeholderResponse, Error, { submittalId: string; input: SubmittalStakeholderInput }>({
    mutationFn: ({ submittalId, input }) => addSubmittalStakeholder(submittalId, input),
    onSuccess: (_, { submittalId }) => {
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.detail(submittalId) });
    },
  });
}

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
// Revision & Email Mutations
// ============================================================================

export function useCreateSubmittalRevision() {
  const queryClient = useQueryClient();

  return useMutation<SubmittalRevisionResponse, Error, { submittalId: string; notes?: string }>({
    mutationFn: ({ submittalId, notes }) => createSubmittalRevision(submittalId, notes),
    onSuccess: (_, { submittalId }) => {
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.detail(submittalId) });
    },
  });
}

export function useSendSubmittalEmail() {
  const queryClient = useQueryClient();

  return useMutation<SendSubmittalEmailResponse, Error, SendSubmittalEmailInput>({
    mutationFn: sendSubmittalEmail,
    onSuccess: (_, { submittalId }) => {
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: submittalQueryKeys.detail(submittalId) });
    },
  });
}

// ============================================================================
// PDF Generation Mutations
// ============================================================================

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
// Returned PDF & Change Analysis Mutations
// ============================================================================

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
// Item Change Mutations
// ============================================================================

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
