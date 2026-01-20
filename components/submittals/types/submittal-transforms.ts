/**
 * Submittal Types and Transform Functions
 * Handles conversion between API responses and frontend types
 */

import type { SubmittalResponse, SubmittalStatusGQL } from '../api/useSubmittalsApi';
import type { Submittal, SubmittalStatus, SpecSheetMatchStatus } from '../../../lib/types/submittals';
import { defaultSubmittalConfig } from '../../../lib/types/submittals';

// Simplified type for API data display in list/grid views
export interface SubmittalDisplay {
  id: string;
  jobName: string;
  submittalNumber: string;
  status: SubmittalStatus;
  submittalDate: string;
  updatedAt: string;
  createdBy: string;
  currentRevision: number;
  customers: Array<{ companyName?: string; contactName?: string }>;
  items: Array<{
    id: string;
    fixtureType: string;
    catalogNumber: string;
    matchStatus: 'matched_with_highlight' | 'matched_no_highlight' | 'no_match';
  }>;
}

// Map API status to frontend status
export const statusApiToFrontend: Record<SubmittalStatusGQL, SubmittalStatus> = {
  'DRAFT': 'draft',
  'SUBMITTED': 'for_approval',
  'APPROVED': 'approved',
  'APPROVED_AS_NOTED': 'approved_as_noted',
  'REVISE_AND_RESUBMIT': 'resubmit_for_approval',
  'REJECTED': 'rejected',
};

export const statusFrontendToApi: Record<string, SubmittalStatusGQL | undefined> = {
  'draft': 'DRAFT',
  'for_approval': 'SUBMITTED',
  'approved': 'APPROVED',
  'approved_as_noted': 'APPROVED_AS_NOTED',
  'resubmit_for_approval': 'REVISE_AND_RESUBMIT',
  'rejected': 'REJECTED',
  'all': undefined,
};

// Transform API response to display type for list/grid views
export function transformSubmittalResponse(response: SubmittalResponse): SubmittalDisplay {
  return {
    id: response.id,
    jobName: response.description || `Submittal ${response.submittalNumber}`,
    submittalNumber: response.submittalNumber,
    status: statusApiToFrontend[response.status] || 'draft',
    submittalDate: response.createdAt,
    updatedAt: response.createdAt,
    createdBy: response.createdBy?.fullName || 'Unknown',
    currentRevision: response.revisions?.length ? response.revisions.length - 1 : 0,
    customers: response.stakeholders
      ?.filter(s => s.role === 'CUSTOMER')
      .map(s => ({
        companyName: s.companyName || 'Unknown',
        contactName: s.contactName || '',
      })) || [],
    items: response.items?.map((item, index) => ({
      id: item.id,
      fixtureType: `F${item.itemNumber || index + 1}`,
      catalogNumber: item.partNumber || '',
      matchStatus: item.matchStatus === 'EXACT_MATCH' ? 'matched_with_highlight' as const :
                   item.matchStatus === 'PARTIAL_MATCH' ? 'matched_no_highlight' as const : 'no_match' as const,
    })) || [],
  };
}

// Helper function to map match status
function mapMatchStatus(status: string): SpecSheetMatchStatus {
  if (status === 'EXACT_MATCH') return 'matched_with_highlight';
  if (status === 'PARTIAL_MATCH') return 'matched_no_highlight';
  return 'no_match';
}

// Transform API response to full Submittal type for detail panel
export function transformToFullSubmittal(response: SubmittalResponse): Submittal {
  return {
    id: response.id,
    jobId: response.jobId || undefined,
    jobName: response.description || `Submittal ${response.submittalNumber}`,
    jobLocation: response.jobLocation || undefined,
    quoteIds: response.quoteId ? [response.quoteId] : [],
    customers: response.stakeholders
      ?.filter(s => s.role === 'CUSTOMER')
      .map(s => ({
        contactId: s.id,
        contactName: s.contactName || '',
        companyName: s.companyName || undefined,
        email: s.contactEmail || undefined,
        role: 'customer' as const,
      })) || [],
    engineers: response.stakeholders
      ?.filter(s => s.role === 'ENGINEER')
      .map(s => ({
        contactId: s.id,
        contactName: s.contactName || '',
        companyName: s.companyName || undefined,
        email: s.contactEmail || undefined,
        role: 'engineer' as const,
      })) || [],
    architects: response.stakeholders
      ?.filter(s => s.role === 'ARCHITECT')
      .map(s => ({
        contactId: s.id,
        contactName: s.contactName || '',
        companyName: s.companyName || undefined,
        email: s.contactEmail || undefined,
        role: 'architect' as const,
      })) || [],
    bidDate: response.bidDate || undefined,
    submittalDate: response.createdAt,
    createdAt: response.createdAt,
    updatedAt: response.createdAt,
    status: statusApiToFrontend[response.status] || 'draft',
    currentRevision: response.revisions?.length ? response.revisions.length - 1 : 0,
    items: response.items?.map((item, index) => ({
      id: item.id,
      submittalId: response.id,
      quoteLineItemId: item.quoteDetailId || undefined,
      quoteId: response.quoteId || undefined,
      fixtureType: `F${item.itemNumber || index + 1}`,
      manufacturer: '',
      catalogNumber: item.partNumber || '',
      description: item.description || '',
      quantity: item.quantity || undefined,
      specSheetId: item.specSheetId || undefined,
      highlightDefinitionId: item.highlightVersionId || undefined,
      specSheet: item.specSheet ? {
        id: item.specSheet.id,
        displayName: item.specSheet.displayName || '',
        fileUrl: item.specSheet.fileUrl || '',
        pageCount: item.specSheet.pageCount || 0,
        manufacturer: '',
        fileName: item.specSheet.displayName || '',
        categories: [],
        tags: [],
        uploadSource: 'file' as const,
        fileSize: 0,
        uploadedAt: '',
        uploadedBy: '',
        needsReview: false,
        usageCount: 0,
      } : undefined,
      highlightVersion: item.highlightVersion ? {
        id: item.highlightVersion.id,
        specSheetId: item.specSheetId || '',
        catalogNumber: '',
        manufacturer: '',
        regions: [],
        createdAt: '',
        createdBy: '',
        updatedAt: '',
        updatedBy: '',
      } : undefined,
      matchStatus: mapMatchStatus(item.matchStatus),
      itemApprovalStatus: item.approvalStatus === 'APPROVED' ? 'approved' :
                          item.approvalStatus === 'APPROVED_AS_NOTED' ? 'approved_as_noted' :
                          item.approvalStatus === 'REJECTED' ? 'rejected' :
                          item.approvalStatus === 'REVISE' ? 'revise_and_resubmit' : 'pending',
      sortOrder: item.itemNumber || index,
    })) || [],
    revisions: response.revisions?.map(rev => ({
      revisionNumber: rev.revisionNumber,
      generatedAt: rev.createdAt,
      generatedBy: rev.createdBy?.fullName || 'Unknown',
      generatedPdfUrl: rev.pdfFileUrl || undefined,
      generatedPdfName: rev.pdfFileName || undefined,
      outputOptions: {
        includeCoverPage: true,
        includeTransmittalPage: true,
        includeFixtureSummary: true,
        showQuantities: true,
        showDescriptions: true,
        showLeadTimes: false,
        useCustomerLogo: false,
        attachments: [],
        transmittedFor: [],
        addressedTo: [],
      },
      emailsSent: [],
      returnedPdfs: [],
    })) || [],
    config: response.config ? {
      includeLamps: response.config.includeLamps,
      includeAccessories: response.config.includeAccessories,
      includeCQ: response.config.includeCq,
      includeFromOrders: response.config.includeFromOrders,
      rollUpKits: response.config.rollUpKits,
      rollUpAccessories: response.config.rollUpAccessories,
      includeZeroQuantityItems: response.config.includeZeroQuantityItems,
      dropDescriptions: response.config.dropDescriptions,
      dropLineNotes: response.config.dropLineNotes,
    } : defaultSubmittalConfig,
    createdBy: response.createdBy?.fullName || 'Unknown',
    updatedBy: response.createdBy?.fullName || 'Unknown',
    tags: response.tags || [],
  };
}
