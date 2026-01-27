/**
 * Submittals GraphQL Module
 * GraphQL queries and API functions for Submittals
 */

import { crmGraphQLRequest, formatCreatedBy } from './client';
import type { SpecSheetResponse, HighlightVersionResponse } from './spec-sheets';

// ============================================================================
// Enums
// ============================================================================

export type SubmittalStatusGQL =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'APPROVED_AS_NOTED'
  | 'REVISE_AND_RESUBMIT'
  | 'REJECTED';

export type SubmittalItemApprovalStatusGQL =
  | 'PENDING'
  | 'APPROVED'
  | 'APPROVED_AS_NOTED'
  | 'REVISE'
  | 'REJECTED';

export type SubmittalItemMatchStatusGQL =
  | 'NO_MATCH'
  | 'PARTIAL_MATCH'
  | 'EXACT_MATCH';

export type SubmittalStakeholderRoleGQL =
  | 'CUSTOMER'
  | 'ENGINEER'
  | 'ARCHITECT'
  | 'GENERAL_CONTRACTOR'
  | 'OTHER';

export type TransmittalPurposeGQL =
  | 'FOR_APPROVAL'
  | 'FOR_REVIEW'
  | 'FOR_INFORMATION'
  | 'FOR_RECORD'
  | 'RESUBMITTAL';

export type ChangeAnalysisSourceGQL = 'MANUAL' | 'AI';

export type OverallChangeStatusGQL =
  | 'APPROVED'
  | 'APPROVED_AS_NOTED'
  | 'REVISE_AND_RESUBMIT'
  | 'REJECTED';

export type ItemChangeStatusGQL =
  | 'APPROVED'
  | 'APPROVED_AS_NOTED'
  | 'REVISE'
  | 'REJECTED';

// ============================================================================
// Types
// ============================================================================

export interface SubmittalItemResponse {
  id: string;
  submittalId: string;
  itemNumber: number;
  quoteDetailId: string | null;
  specSheetId: string | null;
  highlightVersionId: string | null;
  partNumber: string | null;
  manufacturer: string | null;
  description: string | null;
  quantity: number | null;
  approvalStatus: SubmittalItemApprovalStatusGQL;
  matchStatus: SubmittalItemMatchStatusGQL;
  notes: string | null;
  createdAt: string;
  specSheet: SpecSheetResponse | null;
  highlightVersion: HighlightVersionResponse | null;
}

export interface SubmittalStakeholderResponse {
  id: string;
  submittalId: string;
  customerId: string | null;
  role: SubmittalStakeholderRoleGQL;
  isPrimary: boolean;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  companyName: string | null;
}

export interface SubmittalEmailResponse {
  id: string;
  submittalId: string;
  revisionId: string | null;
  subject: string;
  body: string | null;
  recipientEmails: string[];
  createdAt: string;
}

export interface SubmittalItemChangeResponse {
  id: string;
  changeAnalysisId: string;
  itemId: string | null;
  fixtureType: string;
  catalogNumber: string;
  manufacturer: string;
  status: ItemChangeStatusGQL;
  notes: string[] | null;
  pageReferences: number[] | null;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubmittalChangeAnalysisResponse {
  id: string;
  returnedPdfId: string;
  analyzedBy: ChangeAnalysisSourceGQL;
  overallStatus: OverallChangeStatusGQL;
  totalChangesDetected: number;
  summary: string | null;
  createdAt: string;
  itemChanges: SubmittalItemChangeResponse[];
}

export interface SubmittalReturnedPdfResponse {
  id: string;
  revisionId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  returnedByStakeholderId: string | null;
  receivedDate: string | null;
  notes: string | null;
  createdAt: string;
  createdById: string | null;
  createdBy: {
    id: string;
    fullName: string;
  } | null;
  returnedByStakeholder: SubmittalStakeholderResponse | null;
  changeAnalysis: SubmittalChangeAnalysisResponse | null;
}

export interface SubmittalRevisionResponse {
  id: string;
  submittalId: string;
  revisionNumber: number;
  pdfFileId: string | null;
  pdfFileUrl: string | null;
  pdfFileName: string | null;
  pdfFileSizeBytes: number | null;
  notes: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    fullName: string;
  };
  emailsSent: SubmittalEmailResponse[];
  returnedPdfs?: SubmittalReturnedPdfResponse[];
}

export interface SubmittalConfigResponse {
  includeLamps: boolean;
  includeAccessories: boolean;
  includeCq: boolean;
  includeFromOrders: boolean;
  rollUpKits: boolean;
  rollUpAccessories: boolean;
  includeZeroQuantityItems: boolean;
  dropDescriptions: boolean;
  dropLineNotes: boolean;
}

export interface SubmittalResponse {
  id: string;
  submittalNumber: string;
  quoteId: string | null;
  jobId: string | null;
  status: SubmittalStatusGQL;
  transmittalPurpose: TransmittalPurposeGQL | null;
  description: string | null;
  jobLocation: string | null;
  bidDate: string | null; // ISO date string (YYYY-MM-DD)
  tags: string[] | null;
  createdAt: string;
  createdBy: {
    id: string;
    fullName: string;
  };
  items: SubmittalItemResponse[];
  stakeholders: SubmittalStakeholderResponse[];
  revisions: SubmittalRevisionResponse[];
  config: SubmittalConfigResponse;
}

export interface CreateSubmittalInput {
  submittalNumber: string;
  quoteId?: string;
  jobId?: string;
  status?: SubmittalStatusGQL;
  transmittalPurpose?: TransmittalPurposeGQL;
  description?: string;
}

export interface SubmittalConfigInput {
  includeLamps?: boolean;
  includeAccessories?: boolean;
  includeCq?: boolean;
  includeFromOrders?: boolean;
  rollUpKits?: boolean;
  rollUpAccessories?: boolean;
  includeZeroQuantityItems?: boolean;
  dropDescriptions?: boolean;
  dropLineNotes?: boolean;
}

export interface UpdateSubmittalInput {
  status?: SubmittalStatusGQL;
  transmittalPurpose?: TransmittalPurposeGQL;
  description?: string;
  jobLocation?: string;
  bidDate?: string; // ISO date string (YYYY-MM-DD)
  tags?: string[];
  config?: SubmittalConfigInput;
}

export interface SubmittalItemInput {
  itemNumber: number;
  quoteDetailId?: string;
  specSheetId?: string;
  highlightVersionId?: string;
  partNumber?: string;
  manufacturer?: string;
  description?: string;
  quantity?: number;
  approvalStatus?: SubmittalItemApprovalStatusGQL;
  matchStatus?: SubmittalItemMatchStatusGQL;
  notes?: string;
}

export interface UpdateSubmittalItemInput {
  specSheetId?: string | null;
  highlightVersionId?: string | null;
  partNumber?: string;
  manufacturer?: string;
  description?: string;
  quantity?: number;
  approvalStatus?: SubmittalItemApprovalStatusGQL;
  matchStatus?: SubmittalItemMatchStatusGQL;
  notes?: string;
}

export interface SubmittalStakeholderInput {
  role: SubmittalStakeholderRoleGQL;
  customerId?: string;
  isPrimary?: boolean;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  companyName?: string;
}

export interface SendSubmittalEmailInput {
  submittalId: string;
  revisionId?: string;
  subject: string;
  body?: string;
  recipientEmails: string[];
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface GenerateSubmittalPdfInput {
  submittalId: string;
  outputType?: 'pdf' | 'email' | 'email_link';
  includeCoverPage?: boolean;
  includeTransmittalPage?: boolean;
  includeFixtureSummary?: boolean;
  includePages?: boolean;
  includeTypeCoverPage?: boolean;
  showQuantities?: boolean;
  showDescriptions?: boolean;
  showLeadTimes?: boolean;
  hideNotes?: boolean;
  useCustomerLogo?: boolean;
  printDuplex?: boolean;
  capFileSizeMb?: number;
  attachedItems?: string[];
  attachedOther?: string;
  transmittedFor?: string[];
  transmittedForOther?: string;
  copies?: number;
  selectedItemIds?: string[];
  addressedToIds?: string[];
  createRevision?: boolean;
  revisionNotes?: string;
}

export interface AddReturnedPdfInput {
  revisionId: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  returnedByStakeholderId?: string;
  receivedDate?: string; // ISO date string (YYYY-MM-DD)
  notes?: string;
}

export interface SubmittalItemChangeInput {
  itemId?: string;
  fixtureType: string;
  catalogNumber: string;
  manufacturer: string;
  status?: ItemChangeStatusGQL;
  notes?: string[];
  pageReferences?: number[];
}

export interface AddChangeAnalysisInput {
  returnedPdfId: string;
  analyzedBy?: ChangeAnalysisSourceGQL;
  overallStatus?: OverallChangeStatusGQL;
  summary?: string;
  itemChanges?: SubmittalItemChangeInput[];
}

export interface UpdateItemChangeInput {
  status?: ItemChangeStatusGQL;
  notes?: string[];
  pageReferences?: number[];
  resolved?: boolean;
  fixtureType?: string;
  catalogNumber?: string;
  manufacturer?: string;
}

export interface GenerateSubmittalPdfResponse {
  success: boolean;
  error?: string;
  pdfUrl?: string;
  pdfFileName?: string;
  pdfFileSizeBytes?: number;
  revision?: SubmittalRevisionResponse;
}

// ============================================================================
// GraphQL Fragments
// ============================================================================

const SUBMITTAL_ITEM_FRAGMENT = `
  fragment SubmittalItemFields on SubmittalItemResponse {
    id
    submittalId
    itemNumber
    quoteDetailId
    specSheetId
    highlightVersionId
    partNumber
    manufacturer
    description
    quantity
    approvalStatus
    matchStatus
    notes
    createdAt
    specSheet {
      id
      factoryId
      displayName
      fileUrl
      pageCount
    }
    highlightVersion {
      id
      name
      versionNumber
    }
  }
`;

const SUBMITTAL_STAKEHOLDER_FRAGMENT = `
  fragment SubmittalStakeholderFields on SubmittalStakeholderResponse {
    id
    submittalId
    customerId
    role
    isPrimary
    contactName
    contactEmail
    contactPhone
    companyName
  }
`;

const SUBMITTAL_ITEM_CHANGE_FRAGMENT = `
  fragment SubmittalItemChangeFields on SubmittalItemChangeResponse {
    id
    changeAnalysisId
    itemId
    fixtureType
    catalogNumber
    manufacturer
    status
    notes
    pageReferences
    resolved
    createdAt
    updatedAt
  }
`;

const SUBMITTAL_CHANGE_ANALYSIS_FRAGMENT = `
  fragment SubmittalChangeAnalysisFields on SubmittalChangeAnalysisResponse {
    id
    returnedPdfId
    analyzedBy
    overallStatus
    totalChangesDetected
    summary
    createdAt
    itemChanges {
      ...SubmittalItemChangeFields
    }
  }
  ${SUBMITTAL_ITEM_CHANGE_FRAGMENT}
`;

// Note: This fragment does NOT include SUBMITTAL_STAKEHOLDER_FRAGMENT to avoid duplication
// when used within SUBMITTAL_FRAGMENT. The stakeholder fragment must be included at the query level.
const SUBMITTAL_RETURNED_PDF_FRAGMENT = `
  fragment SubmittalReturnedPdfFields on SubmittalReturnedPdfResponse {
    id
    revisionId
    fileName
    fileUrl
    fileSize
    returnedByStakeholderId
    receivedDate
    notes
    createdAt
    createdById
    createdBy {
      id
      fullName
    }
    returnedByStakeholder {
      ...SubmittalStakeholderFields
    }
    changeAnalysis {
      ...SubmittalChangeAnalysisFields
    }
  }
  ${SUBMITTAL_CHANGE_ANALYSIS_FRAGMENT}
`;

// Note: This fragment does NOT include SUBMITTAL_STAKEHOLDER_FRAGMENT to avoid duplication.
// The stakeholder fragment must be included at the query level when using this fragment directly.
const SUBMITTAL_REVISION_FRAGMENT = `
  fragment SubmittalRevisionFields on SubmittalRevisionResponse {
    id
    submittalId
    revisionNumber
    pdfFileId
    pdfFileUrl
    pdfFileName
    pdfFileSizeBytes
    notes
    createdAt
    createdBy {
      id
      fullName
    }
    emailsSent {
      id
      submittalId
      revisionId
      subject
      body
      recipientEmails
      createdAt
    }
    returnedPdfs {
      ...SubmittalReturnedPdfFields
    }
  }
  ${SUBMITTAL_RETURNED_PDF_FRAGMENT}
`;

const SUBMITTAL_CONFIG_FRAGMENT = `
  fragment SubmittalConfigFields on SubmittalConfigResponse {
    includeLamps
    includeAccessories
    includeCq
    includeFromOrders
    rollUpKits
    rollUpAccessories
    includeZeroQuantityItems
    dropDescriptions
    dropLineNotes
  }
`;

const SUBMITTAL_FRAGMENT = `
  fragment SubmittalFields on SubmittalResponse {
    id
    submittalNumber
    quoteId
    jobId
    status
    transmittalPurpose
    description
    jobLocation
    bidDate
    tags
    createdAt
    createdBy {
      id
      fullName
    }
    items {
      ...SubmittalItemFields
    }
    stakeholders {
      ...SubmittalStakeholderFields
    }
    revisions {
      ...SubmittalRevisionFields
    }
    config {
      ...SubmittalConfigFields
    }
  }
  ${SUBMITTAL_ITEM_FRAGMENT}
  ${SUBMITTAL_STAKEHOLDER_FRAGMENT}
  ${SUBMITTAL_REVISION_FRAGMENT}
  ${SUBMITTAL_CONFIG_FRAGMENT}
`;

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_SUBMITTAL = `
  query GetSubmittal($id: UUID!) {
    submittal(id: $id) {
      ...SubmittalFields
    }
  }
  ${SUBMITTAL_FRAGMENT}
`;

const GET_SUBMITTALS_BY_QUOTE = `
  query GetSubmittalsByQuote($quoteId: UUID!) {
    submittalsByQuote(quoteId: $quoteId) {
      ...SubmittalFields
    }
  }
  ${SUBMITTAL_FRAGMENT}
`;

const GET_SUBMITTALS_BY_JOB = `
  query GetSubmittalsByJob($jobId: UUID!) {
    submittalsByJob(jobId: $jobId) {
      ...SubmittalFields
    }
  }
  ${SUBMITTAL_FRAGMENT}
`;

const SEARCH_SUBMITTALS = `
  query SearchSubmittals($searchTerm: String, $status: SubmittalStatusGQL, $limit: Int) {
    submittalSearch(searchTerm: $searchTerm, status: $status, limit: $limit) {
      ...SubmittalFields
    }
  }
  ${SUBMITTAL_FRAGMENT}
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const CREATE_SUBMITTAL = `
  mutation CreateSubmittal($input: CreateSubmittalInput!) {
    createSubmittal(input: $input) {
      ...SubmittalFields
    }
  }
  ${SUBMITTAL_FRAGMENT}
`;

const UPDATE_SUBMITTAL = `
  mutation UpdateSubmittal($id: UUID!, $input: UpdateSubmittalInput!) {
    updateSubmittal(id: $id, input: $input) {
      ...SubmittalFields
    }
  }
  ${SUBMITTAL_FRAGMENT}
`;

const DELETE_SUBMITTAL = `
  mutation DeleteSubmittal($id: UUID!) {
    deleteSubmittal(id: $id)
  }
`;

const ADD_SUBMITTAL_ITEM = `
  mutation AddSubmittalItem($submittalId: UUID!, $input: SubmittalItemInput!) {
    addSubmittalItem(submittalId: $submittalId, input: $input) {
      ...SubmittalItemFields
    }
  }
  ${SUBMITTAL_ITEM_FRAGMENT}
`;

const UPDATE_SUBMITTAL_ITEM = `
  mutation UpdateSubmittalItem($id: UUID!, $input: UpdateSubmittalItemInput!) {
    updateSubmittalItem(id: $id, input: $input) {
      ...SubmittalItemFields
    }
  }
  ${SUBMITTAL_ITEM_FRAGMENT}
`;

const REMOVE_SUBMITTAL_ITEM = `
  mutation RemoveSubmittalItem($id: UUID!) {
    removeSubmittalItem(id: $id)
  }
`;

const ADD_SUBMITTAL_STAKEHOLDER = `
  mutation AddSubmittalStakeholder($submittalId: UUID!, $input: SubmittalStakeholderInput!) {
    addSubmittalStakeholder(submittalId: $submittalId, input: $input) {
      ...SubmittalStakeholderFields
    }
  }
  ${SUBMITTAL_STAKEHOLDER_FRAGMENT}
`;

const REMOVE_SUBMITTAL_STAKEHOLDER = `
  mutation RemoveSubmittalStakeholder($id: UUID!) {
    removeSubmittalStakeholder(id: $id)
  }
`;

const CREATE_SUBMITTAL_REVISION = `
  mutation CreateSubmittalRevision($submittalId: UUID!, $notes: String) {
    createSubmittalRevision(submittalId: $submittalId, notes: $notes) {
      ...SubmittalRevisionFields
    }
  }
  ${SUBMITTAL_STAKEHOLDER_FRAGMENT}
  ${SUBMITTAL_REVISION_FRAGMENT}
`;

const SEND_SUBMITTAL_EMAIL = `
  mutation SendSubmittalEmail($input: SendSubmittalEmailInput!) {
    sendSubmittalEmail(input: $input) {
      success
      error
      provider
    }
  }
`;

const GENERATE_SUBMITTAL_PDF = `
  mutation GenerateSubmittalPdf($input: GenerateSubmittalPdfInput!) {
    generateSubmittalPdf(input: $input) {
      success
      error
      pdfUrl
      pdfFileName
      pdfFileSizeBytes
      revision {
        ...SubmittalRevisionFields
      }
    }
  }
  ${SUBMITTAL_STAKEHOLDER_FRAGMENT}
  ${SUBMITTAL_REVISION_FRAGMENT}
`;

const ADD_RETURNED_PDF = `
  mutation AddReturnedPdf($input: AddReturnedPdfInput!) {
    addReturnedPdf(input: $input) {
      ...SubmittalReturnedPdfFields
    }
  }
  ${SUBMITTAL_STAKEHOLDER_FRAGMENT}
  ${SUBMITTAL_RETURNED_PDF_FRAGMENT}
`;

const ADD_CHANGE_ANALYSIS = `
  mutation AddChangeAnalysis($input: AddChangeAnalysisInput!) {
    addChangeAnalysis(input: $input) {
      ...SubmittalChangeAnalysisFields
    }
  }
  ${SUBMITTAL_CHANGE_ANALYSIS_FRAGMENT}
`;

const UPDATE_ITEM_CHANGE = `
  mutation UpdateItemChange($id: UUID!, $input: UpdateItemChangeInput!) {
    updateItemChange(id: $id, input: $input) {
      ...SubmittalItemChangeFields
    }
  }
  ${SUBMITTAL_ITEM_CHANGE_FRAGMENT}
`;

const DELETE_ITEM_CHANGE = `
  mutation DeleteItemChange($id: UUID!) {
    deleteItemChange(id: $id)
  }
`;

const RESOLVE_ITEM_CHANGE = `
  mutation ResolveItemChange($id: UUID!) {
    resolveItemChange(id: $id) {
      ...SubmittalItemChangeFields
    }
  }
  ${SUBMITTAL_ITEM_CHANGE_FRAGMENT}
`;

// ============================================================================
// API Functions - Queries
// ============================================================================

export async function fetchSubmittal(id: string): Promise<SubmittalResponse | null> {
  const response = await crmGraphQLRequest<{ submittal: SubmittalResponse }>({
    query: GET_SUBMITTAL,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch submittal');
  }

  return response.data?.submittal || null;
}

export async function fetchSubmittalsByQuote(quoteId: string): Promise<SubmittalResponse[]> {
  const response = await crmGraphQLRequest<{ submittalsByQuote: SubmittalResponse[] }>({
    query: GET_SUBMITTALS_BY_QUOTE,
    variables: { quoteId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch submittals');
  }

  return response.data?.submittalsByQuote || [];
}

export async function fetchSubmittalsByJob(jobId: string): Promise<SubmittalResponse[]> {
  const response = await crmGraphQLRequest<{ submittalsByJob: SubmittalResponse[] }>({
    query: GET_SUBMITTALS_BY_JOB,
    variables: { jobId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch submittals');
  }

  return response.data?.submittalsByJob || [];
}

export async function searchSubmittals(params: {
  searchTerm?: string;
  status?: SubmittalStatusGQL;
  limit?: number;
}): Promise<SubmittalResponse[]> {
  const response = await crmGraphQLRequest<{ submittalSearch: SubmittalResponse[] }>({
    query: SEARCH_SUBMITTALS,
    variables: params,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search submittals');
  }

  return response.data?.submittalSearch || [];
}

// ============================================================================
// API Functions - Mutations
// ============================================================================

export async function createSubmittal(input: CreateSubmittalInput): Promise<SubmittalResponse> {
  const response = await crmGraphQLRequest<{ createSubmittal: SubmittalResponse }>({
    query: CREATE_SUBMITTAL,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create submittal');
  }

  if (!response.data?.createSubmittal) {
    throw new Error('No submittal returned from create mutation');
  }

  return response.data.createSubmittal;
}

export async function updateSubmittal(id: string, input: UpdateSubmittalInput): Promise<SubmittalResponse> {
  const response = await crmGraphQLRequest<{ updateSubmittal: SubmittalResponse }>({
    query: UPDATE_SUBMITTAL,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update submittal');
  }

  if (!response.data?.updateSubmittal) {
    throw new Error('No submittal returned from update mutation');
  }

  return response.data.updateSubmittal;
}

export async function deleteSubmittal(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteSubmittal: boolean }>({
    query: DELETE_SUBMITTAL,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete submittal');
  }

  return response.data?.deleteSubmittal || false;
}

export async function addSubmittalItem(
  submittalId: string,
  input: SubmittalItemInput
): Promise<SubmittalItemResponse> {
  const response = await crmGraphQLRequest<{ addSubmittalItem: SubmittalItemResponse }>({
    query: ADD_SUBMITTAL_ITEM,
    variables: { submittalId, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to add submittal item');
  }

  if (!response.data?.addSubmittalItem) {
    throw new Error('No item returned from add mutation');
  }

  return response.data.addSubmittalItem;
}

export async function updateSubmittalItem(
  id: string,
  input: UpdateSubmittalItemInput
): Promise<SubmittalItemResponse> {
  const response = await crmGraphQLRequest<{ updateSubmittalItem: SubmittalItemResponse }>({
    query: UPDATE_SUBMITTAL_ITEM,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update submittal item');
  }

  if (!response.data?.updateSubmittalItem) {
    throw new Error('No item returned from update mutation');
  }

  return response.data.updateSubmittalItem;
}

export async function removeSubmittalItem(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ removeSubmittalItem: boolean }>({
    query: REMOVE_SUBMITTAL_ITEM,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to remove submittal item');
  }

  return response.data?.removeSubmittalItem || false;
}

export async function addSubmittalStakeholder(
  submittalId: string,
  input: SubmittalStakeholderInput
): Promise<SubmittalStakeholderResponse> {
  const response = await crmGraphQLRequest<{ addSubmittalStakeholder: SubmittalStakeholderResponse }>({
    query: ADD_SUBMITTAL_STAKEHOLDER,
    variables: { submittalId, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to add stakeholder');
  }

  if (!response.data?.addSubmittalStakeholder) {
    throw new Error('No stakeholder returned from add mutation');
  }

  return response.data.addSubmittalStakeholder;
}

export async function removeSubmittalStakeholder(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ removeSubmittalStakeholder: boolean }>({
    query: REMOVE_SUBMITTAL_STAKEHOLDER,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to remove stakeholder');
  }

  return response.data?.removeSubmittalStakeholder || false;
}

export async function createSubmittalRevision(
  submittalId: string,
  notes?: string
): Promise<SubmittalRevisionResponse> {
  const response = await crmGraphQLRequest<{ createSubmittalRevision: SubmittalRevisionResponse }>({
    query: CREATE_SUBMITTAL_REVISION,
    variables: { submittalId, notes },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create revision');
  }

  if (!response.data?.createSubmittalRevision) {
    throw new Error('No revision returned from create mutation');
  }

  return response.data.createSubmittalRevision;
}

export interface SendSubmittalEmailResponse {
  success: boolean;
  error?: string;
  provider?: string;
}

export async function sendSubmittalEmail(input: SendSubmittalEmailInput): Promise<SendSubmittalEmailResponse> {
  const response = await crmGraphQLRequest<{ sendSubmittalEmail: SendSubmittalEmailResponse }>({
    query: SEND_SUBMITTAL_EMAIL,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to send email');
  }

  if (!response.data?.sendSubmittalEmail) {
    throw new Error('No response returned from send email mutation');
  }

  const result = response.data.sendSubmittalEmail;
  if (!result.success && result.error) {
    throw new Error(result.error);
  }

  return result;
}

export async function generateSubmittalPdf(
  input: GenerateSubmittalPdfInput
): Promise<GenerateSubmittalPdfResponse> {
  const response = await crmGraphQLRequest<{ generateSubmittalPdf: GenerateSubmittalPdfResponse }>({
    query: GENERATE_SUBMITTAL_PDF,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to generate PDF');
  }

  if (!response.data?.generateSubmittalPdf) {
    throw new Error('No response returned from generate PDF mutation');
  }

  return response.data.generateSubmittalPdf;
}

export async function addReturnedPdf(
  input: AddReturnedPdfInput
): Promise<SubmittalReturnedPdfResponse> {
  const response = await crmGraphQLRequest<{ addReturnedPdf: SubmittalReturnedPdfResponse }>({
    query: ADD_RETURNED_PDF,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to add returned PDF');
  }

  if (!response.data?.addReturnedPdf) {
    throw new Error('No response returned from add returned PDF mutation');
  }

  return response.data.addReturnedPdf;
}

export async function addChangeAnalysis(
  input: AddChangeAnalysisInput
): Promise<SubmittalChangeAnalysisResponse> {
  const response = await crmGraphQLRequest<{ addChangeAnalysis: SubmittalChangeAnalysisResponse }>({
    query: ADD_CHANGE_ANALYSIS,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to add change analysis');
  }

  if (!response.data?.addChangeAnalysis) {
    throw new Error('No response returned from add change analysis mutation');
  }

  return response.data.addChangeAnalysis;
}

export async function updateItemChange(
  id: string,
  input: UpdateItemChangeInput
): Promise<SubmittalItemChangeResponse> {
  const response = await crmGraphQLRequest<{ updateItemChange: SubmittalItemChangeResponse }>({
    query: UPDATE_ITEM_CHANGE,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update item change');
  }

  if (!response.data?.updateItemChange) {
    throw new Error('No response returned from update item change mutation');
  }

  return response.data.updateItemChange;
}

export async function deleteItemChange(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteItemChange: boolean }>({
    query: DELETE_ITEM_CHANGE,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete item change');
  }

  return response.data?.deleteItemChange || false;
}

export async function resolveItemChange(id: string): Promise<SubmittalItemChangeResponse> {
  const response = await crmGraphQLRequest<{ resolveItemChange: SubmittalItemChangeResponse }>({
    query: RESOLVE_ITEM_CHANGE,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to resolve item change');
  }

  if (!response.data?.resolveItemChange) {
    throw new Error('No response returned from resolve item change mutation');
  }

  return response.data.resolveItemChange;
}
