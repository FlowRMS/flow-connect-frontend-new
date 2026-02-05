/**
 * Submittals API React Query Hooks
 * Re-exports all query and mutation hooks for submittals
 */

// Re-export query hooks and keys
export {
  submittalQueryKeys,
  useSubmittal,
  useSubmittalsByQuote,
  useSubmittalsByJob,
  useSubmittalSearch,
} from './useSubmittalsQueries';

// Re-export mutation hooks
export {
  useCreateSubmittal,
  useUpdateSubmittal,
  useDeleteSubmittal,
  useAddSubmittalItem,
  useUpdateSubmittalItem,
  useRemoveSubmittalItem,
  useAddSubmittalStakeholder,
  useRemoveSubmittalStakeholder,
  useCreateSubmittalRevision,
  useSendSubmittalEmail,
  useGenerateSubmittalPdf,
  useAddReturnedPdf,
  useAddChangeAnalysis,
  useUpdateItemChange,
  useDeleteItemChange,
  useResolveItemChange,
} from './useSubmittalsMutations';

// Re-export types from GraphQL module
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
