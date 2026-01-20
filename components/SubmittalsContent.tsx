'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  useSubmittalSearch,
  useCreateSubmittal,
  useUpdateSubmittal,
  useUpdateSubmittalItem,
  useGenerateSubmittalPdf,
  useAddSubmittalItem,
  useAddSubmittalStakeholder,
  type SubmittalResponse,
  type SubmittalStatusGQL,
  type GenerateSubmittalPdfInput,
  type UpdateSubmittalItemInput,
  type SubmittalItemInput,
  type SubmittalStakeholderInput,
  type SubmittalStakeholderRoleGQL,
} from './submittals/api/useSubmittalsApi';
import {
  submittalStatusLabels,
  submittalStatusColors,
} from '../lib/data/submittals-mock';
import type { Submittal, SubmittalStatus, SpecSheetMatchStatus } from '../lib/types/submittals';
import { defaultSubmittalConfig } from '../lib/types/submittals';
import { submittalToasts } from './lib/toast';

// Dynamically import heavy components to reduce initial bundle
const SubmittalDetailPanel = dynamic(
  () => import('./submittals/SubmittalDetailPanel'),
  { ssr: false, loading: () => <div className="animate-pulse bg-[var(--muted)] h-full" /> }
);

const CreateSubmittalModal = dynamic(
  () => import('./submittals/CreateSubmittalModal'),
  { ssr: false, loading: () => <div className="animate-pulse bg-[var(--muted)] h-64 rounded-lg" /> }
);

const PrintSubmittalDialog = dynamic(
  () => import('./submittals/PrintSubmittalDialog'),
  { ssr: false, loading: () => <div className="animate-pulse bg-[var(--muted)] h-64 rounded-lg" /> }
);

// Simplified type for API data display
interface SubmittalDisplay {
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
const statusApiToFrontend: Record<SubmittalStatusGQL, SubmittalStatus> = {
  'DRAFT': 'draft',
  'SUBMITTED': 'for_approval',
  'APPROVED': 'approved',
  'APPROVED_AS_NOTED': 'approved_as_noted',
  'REVISE_AND_RESUBMIT': 'resubmit_for_approval',
  'REJECTED': 'rejected',
};

const statusFrontendToApi: Record<string, SubmittalStatusGQL | undefined> = {
  'draft': 'DRAFT',
  'for_approval': 'SUBMITTED',
  'approved': 'APPROVED',
  'approved_as_noted': 'APPROVED_AS_NOTED',
  'resubmit_for_approval': 'REVISE_AND_RESUBMIT',
  'rejected': 'REJECTED',
  'all': undefined,
};

// Transform API response to display type
function transformSubmittalResponse(response: SubmittalResponse): SubmittalDisplay {
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
    items: response.items?.map(item => ({
      id: item.id,
      fixtureType: item.partNumber || 'Unknown',
      catalogNumber: item.partNumber || '',
      matchStatus: item.matchStatus === 'EXACT_MATCH' ? 'matched_with_highlight' as const :
                   item.matchStatus === 'PARTIAL_MATCH' ? 'matched_no_highlight' as const : 'no_match' as const,
    })) || [],
  };
}

// Transform API response to full Submittal type for detail panel
function transformToFullSubmittal(response: SubmittalResponse): Submittal {
  const mapMatchStatus = (status: string): SpecSheetMatchStatus => {
    if (status === 'EXACT_MATCH') return 'matched_with_highlight';
    if (status === 'PARTIAL_MATCH') return 'matched_no_highlight';
    return 'no_match';
  };

  return {
    id: response.id,
    jobId: response.jobId || undefined,
    jobName: response.description || `Submittal ${response.submittalNumber}`,
    jobLocation: undefined,
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
    bidDate: undefined,
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
      fixtureType: item.partNumber || `Item ${index + 1}`,
      manufacturer: '', // Not provided in API response
      catalogNumber: item.partNumber || '',
      description: item.description || '',
      quantity: item.quantity || undefined,
      specSheetId: item.specSheetId || undefined,
      highlightDefinitionId: item.highlightVersionId || undefined,
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
    config: defaultSubmittalConfig,
    createdBy: response.createdBy?.fullName || 'Unknown',
    updatedBy: response.createdBy?.fullName || 'Unknown',
    tags: [],
  };
}

export default function SubmittalsContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmittalStatus | 'all'>('all');
  const [selectedSubmittalId, setSelectedSubmittalId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  // API hooks
  const apiStatus = statusFrontendToApi[statusFilter];
  const { data: submittalsData, isLoading, error, refetch } = useSubmittalSearch({
    searchTerm: searchQuery || undefined,
    status: apiStatus,
    limit: 100,
  });
  const createSubmittalMutation = useCreateSubmittal();
  const updateSubmittalMutation = useUpdateSubmittal();
  const updateSubmittalItemMutation = useUpdateSubmittalItem();
  const generatePdfMutation = useGenerateSubmittalPdf();
  const addSubmittalItemMutation = useAddSubmittalItem();
  const addSubmittalStakeholderMutation = useAddSubmittalStakeholder();

  // Find raw API response for selected submittal (to pass to detail panel)
  const selectedSubmittalRaw = useMemo(() => {
    if (!selectedSubmittalId || !submittalsData) return null;
    return submittalsData.find(s => s.id === selectedSubmittalId) || null;
  }, [selectedSubmittalId, submittalsData]);

  // Transform to full Submittal type for detail panel
  const selectedSubmittalFull = useMemo(() => {
    if (!selectedSubmittalRaw) return null;
    return transformToFullSubmittal(selectedSubmittalRaw);
  }, [selectedSubmittalRaw]);

  // Handle submittal update from detail panel
  const handleSubmittalUpdate = useCallback(async (updates: Partial<Submittal>) => {
    if (!selectedSubmittalId) return;

    // Handle item updates (spec sheet attachments, etc.)
    if (updates.items && selectedSubmittalFull) {
      // Find items that have changed
      for (const updatedItem of updates.items) {
        const originalItem = selectedSubmittalFull.items.find(i => i.id === updatedItem.id);
        if (!originalItem) continue;

        // Check if spec sheet or highlight version changed
        const hasChanges =
          originalItem.specSheetId !== updatedItem.specSheetId ||
          originalItem.highlightDefinitionId !== updatedItem.highlightDefinitionId;

        if (hasChanges) {
          try {
            const itemUpdate: UpdateSubmittalItemInput = {};
            if (originalItem.specSheetId !== updatedItem.specSheetId) {
              itemUpdate.specSheetId = updatedItem.specSheetId || undefined;
            }
            if (originalItem.highlightDefinitionId !== updatedItem.highlightDefinitionId) {
              itemUpdate.highlightVersionId = updatedItem.highlightDefinitionId || undefined;
            }

            await updateSubmittalItemMutation.mutateAsync({
              id: updatedItem.id,
              input: itemUpdate,
              submittalId: selectedSubmittalId,
            });
            console.log(`Updated item ${updatedItem.id} with spec sheet/highlight changes`);
          } catch (err) {
            console.error('Error updating submittal item:', err);
          }
        }
      }
    }

    // Map frontend status to API status if needed
    const apiUpdates: { status?: SubmittalStatusGQL; description?: string } = {};
    if (updates.status) {
      apiUpdates.status = statusFrontendToApi[updates.status] as SubmittalStatusGQL;
    }
    if (updates.jobName) {
      apiUpdates.description = updates.jobName;
    }

    if (Object.keys(apiUpdates).length > 0) {
      try {
        await updateSubmittalMutation.mutateAsync({
          id: selectedSubmittalId,
          input: apiUpdates,
        });
      } catch (err) {
        console.error('Error updating submittal:', err);
      }
    }
  }, [selectedSubmittalId, selectedSubmittalFull, updateSubmittalMutation, updateSubmittalItemMutation]);

  // Handle create submittal from modal
  const handleCreateSubmittal = useCallback(async (newSubmittal: Partial<Submittal>) => {
    try {
      // 1. Create the submittal
      const createdSubmittal = await createSubmittalMutation.mutateAsync({
        submittalNumber: `SUB-${Date.now()}`,
        description: newSubmittal.jobName || 'New Submittal',
        status: 'DRAFT',
        quoteId: newSubmittal.quoteIds?.[0],
      });

      const submittalId = createdSubmittal.id;

      // 2. Add items
      if (newSubmittal.items && newSubmittal.items.length > 0) {
        for (let i = 0; i < newSubmittal.items.length; i++) {
          const item = newSubmittal.items[i];
          const itemInput: SubmittalItemInput = {
            itemNumber: i + 1,
            partNumber: item.catalogNumber || item.fixtureType,
            description: item.description,
            quantity: item.quantity,
            matchStatus: 'NO_MATCH',
          };
          await addSubmittalItemMutation.mutateAsync({ submittalId, input: itemInput });
        }
      }

      // 3. Add stakeholders (customers, engineers, architects)
      const mapRoleToGQL = (role: string): SubmittalStakeholderRoleGQL => {
        switch (role) {
          case 'customer': return 'CUSTOMER';
          case 'engineer': return 'ENGINEER';
          case 'architect': return 'ARCHITECT';
          case 'gc': return 'GENERAL_CONTRACTOR';
          default: return 'OTHER';
        }
      };

      const allStakeholders = [
        ...(newSubmittal.customers || []),
        ...(newSubmittal.engineers || []),
        ...(newSubmittal.architects || []),
      ];

      for (const stakeholder of allStakeholders) {
        const stakeholderInput: SubmittalStakeholderInput = {
          role: mapRoleToGQL(stakeholder.role),
          contactName: stakeholder.contactName,
          contactEmail: stakeholder.email,
          companyName: stakeholder.companyName,
        };
        await addSubmittalStakeholderMutation.mutateAsync({ submittalId, input: stakeholderInput });
      }

      setShowCreateModal(false);
      submittalToasts.createSuccess(createdSubmittal.submittalNumber);
      refetch();
    } catch (err) {
      console.error('Error creating submittal:', err);
      submittalToasts.createError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [createSubmittalMutation, addSubmittalItemMutation, addSubmittalStakeholderMutation, refetch]);

  // Transform API data to display format
  const submittals = useMemo(() => {
    if (!submittalsData) return [];
    return submittalsData.map(transformSubmittalResponse);
  }, [submittalsData]);

  // Filter submittals
  const filteredSubmittals = useMemo(() => {
    let result = [...submittals];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.jobName.toLowerCase().includes(query) ||
        s.submittalNumber?.toLowerCase().includes(query) ||
        s.items.some(i => i.catalogNumber.toLowerCase().includes(query))
      );
    }

    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [submittals, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = submittals.length;
    const draft = submittals.filter(s => s.status === 'draft').length;
    const forApproval = submittals.filter(s => s.status === 'for_approval' || s.status === 'resubmit_for_approval').length;
    const approved = submittals.filter(s => s.status === 'approved' || s.status === 'approved_as_noted' || s.status === 'approved_as_submitted').length;
    return { total, draft, forApproval, approved };
  }, [submittals]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
        </div>
        <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Error loading submittals</h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Submittals</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Manage submittal packages for your projects
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/spec-sheets"
              className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Spec Sheet Library
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
              </svg>
              New Submittal
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6 mb-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`text-sm ${statusFilter === 'all' ? 'text-[var(--primary)] font-medium' : 'text-[var(--muted-foreground)]'}`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`text-sm ${statusFilter === 'draft' ? 'text-[var(--primary)] font-medium' : 'text-[var(--muted-foreground)]'}`}
          >
            Drafts ({stats.draft})
          </button>
          <button
            onClick={() => setStatusFilter('for_approval')}
            className={`text-sm ${statusFilter === 'for_approval' ? 'text-[var(--primary)] font-medium' : 'text-[var(--muted-foreground)]'}`}
          >
            Pending Approval ({stats.forApproval})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`text-sm ${statusFilter === 'approved' ? 'text-[var(--primary)] font-medium' : 'text-[var(--muted-foreground)]'}`}
          >
            Approved ({stats.approved})
          </button>
        </div>

        {/* Search & View Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
              <circle cx="9" cy="9" r="7"/>
              <path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search submittals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
            />
          </div>
          <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-[var(--muted)]' : ''} transition-colors`}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 10h16M4 14h16M4 18h16" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-[var(--muted)]' : ''} transition-colors`}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="6" height="6" rx="1"/>
                <rect x="11" y="3" width="6" height="6" rx="1"/>
                <rect x="3" y="11" width="6" height="6" rx="1"/>
                <rect x="11" y="11" width="6" height="6" rx="1"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">Loading submittals...</p>
          </div>
        ) : filteredSubmittals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6M9 15l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No submittals found</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4 max-w-sm">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first submittal package to get started'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                </svg>
                New Submittal
              </button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-4">
            {filteredSubmittals.map((submittal) => (
              <div
                key={submittal.id}
                className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedSubmittalId(submittal.id)}
              >
                <div className="px-5 py-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-[var(--foreground)]">{submittal.jobName}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${submittalStatusColors[submittal.status]?.bg || 'bg-gray-100'} ${submittalStatusColors[submittal.status]?.text || 'text-gray-800'}`}>
                        {submittalStatusLabels[submittal.status] || submittal.status}
                      </span>
                      {submittal.currentRevision > 0 && (
                        <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded">
                          Rev {submittal.currentRevision}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)] mb-2">#{submittal.submittalNumber}</p>
                    <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                      <span>{new Date(submittal.submittalDate).toLocaleDateString()}</span>
                      <span>{submittal.items.length} items</span>
                      {submittal.customers.length > 0 && submittal.customers[0].companyName && (
                        <span>{submittal.customers[0].companyName}</span>
                      )}
                    </div>
                  </div>
                </div>

                {submittal.items.length > 0 && (
                  <div className="px-5 pb-4">
                    <div className="flex flex-wrap gap-2">
                      {submittal.items.slice(0, 5).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 px-2 py-1 bg-[var(--muted)]/50 rounded text-xs">
                          <span className="font-medium">{item.fixtureType}</span>
                          <span className={`w-2 h-2 rounded-full ${
                            item.matchStatus === 'matched_with_highlight' ? 'bg-green-500' :
                            item.matchStatus === 'matched_no_highlight' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                        </div>
                      ))}
                      {submittal.items.length > 5 && (
                        <span className="px-2 py-1 text-xs text-[var(--muted-foreground)]">
                          +{submittal.items.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="px-5 py-3 bg-[var(--muted)]/30 border-t border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-green-600">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      {submittal.items.filter(i => i.matchStatus === 'matched_with_highlight').length} ready
                    </span>
                    <span className="flex items-center gap-1 text-yellow-600">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      {submittal.items.filter(i => i.matchStatus === 'matched_no_highlight').length} need highlights
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      {submittal.items.filter(i => i.matchStatus === 'no_match').length} missing
                    </span>
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Updated {new Date(submittal.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubmittals.map((submittal) => (
              <div
                key={submittal.id}
                className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedSubmittalId(submittal.id)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${submittalStatusColors[submittal.status]?.bg || 'bg-gray-100'} ${submittalStatusColors[submittal.status]?.text || 'text-gray-800'}`}>
                      {submittalStatusLabels[submittal.status] || submittal.status}
                    </span>
                    {submittal.currentRevision > 0 && (
                      <span className="text-xs text-[var(--muted-foreground)]">Rev {submittal.currentRevision}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-1 line-clamp-1">{submittal.jobName}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mb-3">#{submittal.submittalNumber}</p>
                  <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                    <span>{submittal.items.length} items</span>
                    <span>{new Date(submittal.submittalDate).toLocaleDateString()}</span>
                  </div>
                </div>
                {submittal.items.length > 0 && (
                  <div className="px-4 py-2 bg-[var(--muted)]/30 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{
                            width: `${(submittal.items.filter(i => i.matchStatus === 'matched_with_highlight').length / submittal.items.length) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {Math.round((submittal.items.filter(i => i.matchStatus === 'matched_with_highlight').length / submittal.items.length) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Panel - Full component */}
      {selectedSubmittalFull && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-3xl bg-[var(--background)] shadow-xl overflow-auto">
            <SubmittalDetailPanel
              submittal={selectedSubmittalFull}
              onClose={() => setSelectedSubmittalId(null)}
              onUpdate={handleSubmittalUpdate}
              onPrint={() => setShowPrintDialog(true)}
            />
          </div>
        </div>
      )}

      {/* Create Modal - Full component */}
      {showCreateModal && (
        <CreateSubmittalModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateSubmittal}
        />
      )}

      {/* Print Dialog */}
      {showPrintDialog && selectedSubmittalFull && (
        <PrintSubmittalDialog
          submittal={selectedSubmittalFull}
          onClose={() => setShowPrintDialog(false)}
          onPrint={async (settings) => {
            console.log('Print settings:', settings);
            try {
              const input: GenerateSubmittalPdfInput = {
                submittalId: selectedSubmittalFull.id,
                outputType: settings.outputType,
                includeCoverPage: settings.outputOptions.includeCoverPage,
                includeTransmittalPage: settings.outputOptions.includeTransmittalPage,
                includeFixtureSummary: settings.outputOptions.includeFixtureSummary,
                showQuantities: settings.outputOptions.showQuantities,
                showDescriptions: settings.outputOptions.showDescriptions,
                showLeadTimes: settings.outputOptions.showLeadTimes,
                useCustomerLogo: settings.outputOptions.useCustomerLogo,
                capFileSizeMb: settings.capFileSize !== 'none' ? parseInt(settings.capFileSize) : undefined,
                attachedItems: settings.transmittal.attached,
                attachedOther: settings.transmittal.attachedOther || undefined,
                transmittedFor: settings.transmittal.transmittedFor,
                transmittedForOther: settings.transmittal.transmittedForOther || undefined,
                copies: settings.transmittal.copies,
                selectedItemIds: settings.selectedItemIds,
                addressedToIds: settings.outputOptions.addressedTo?.map(s => s.contactId),
                createRevision: true,
              };

              const result = await generatePdfMutation.mutateAsync(input);

              if (result.success && result.pdfUrl) {
                // Open PDF in new tab or trigger download
                if (result.pdfUrl.startsWith('data:')) {
                  // Base64 data URL - open in new tab
                  const newWindow = window.open();
                  if (newWindow) {
                    newWindow.document.write(`<iframe src="${result.pdfUrl}" style="width:100%;height:100%;border:none;"></iframe>`);
                  }
                } else {
                  // Regular URL - download
                  window.open(result.pdfUrl, '_blank');
                }
              submittalToasts.pdfSuccess();
              } else if (!result.success) {
                console.error('PDF generation failed:', result.error);
                submittalToasts.pdfError(result.error);
              }
            } catch (error) {
              console.error('Error generating PDF:', error);
              submittalToasts.pdfError(error instanceof Error ? error.message : 'Unknown error');
            }
            setShowPrintDialog(false);
          }}
        />
      )}
    </div>
  );
}
