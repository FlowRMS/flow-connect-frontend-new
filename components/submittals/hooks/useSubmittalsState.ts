/**
 * Submittals State Management Hook
 * Handles all state, API calls, and handlers for the Submittals page
 */

import { useState, useMemo } from 'react';
import {
  useSubmittalSearch,
  useCreateSubmittal,
  useUpdateSubmittal,
  useDeleteSubmittal,
  useUpdateSubmittalItem,
  useGenerateSubmittalPdf,
  useAddSubmittalItem,
  useRemoveSubmittalItem,
  useAddSubmittalStakeholder,
  useRemoveSubmittalStakeholder,
} from '../api/useSubmittalsApi';
import type { SubmittalStatus } from '../../../lib/types/submittals';
import {
  transformSubmittalResponse,
  transformToFullSubmittal,
  statusFrontendToApi,
  type SubmittalDisplay,
} from '../types/submittal-transforms';
import { useSubmittalHandlers } from './useSubmittalHandlers';

export interface SubmittalsStats {
  total: number;
  draft: number;
  forApproval: number;
  approved: number;
}

export function useSubmittalsState() {
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmittalStatus | 'all'>('all');
  const [selectedSubmittalId, setSelectedSubmittalId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);

  // API hooks
  const apiStatus = statusFrontendToApi[statusFilter];
  const { data: submittalsData, isLoading, error, refetch } = useSubmittalSearch({
    searchTerm: searchQuery || undefined,
    status: apiStatus,
    limit: 100,
  });

  // Separate query for stats - always fetches all submittals (no status filter)
  const { data: allSubmittalsData } = useSubmittalSearch({ limit: 100 });

  // Mutation hooks
  const createSubmittalMutation = useCreateSubmittal();
  const updateSubmittalMutation = useUpdateSubmittal();
  const deleteSubmittalMutation = useDeleteSubmittal();
  const updateSubmittalItemMutation = useUpdateSubmittalItem();
  const generatePdfMutation = useGenerateSubmittalPdf();
  const addSubmittalItemMutation = useAddSubmittalItem();
  const removeSubmittalItemMutation = useRemoveSubmittalItem();
  const addSubmittalStakeholderMutation = useAddSubmittalStakeholder();
  const removeSubmittalStakeholderMutation = useRemoveSubmittalStakeholder();

  // Find raw API response for selected submittal
  const selectedSubmittalRaw = useMemo(() => {
    if (!selectedSubmittalId || !submittalsData) return null;
    return submittalsData.find(s => s.id === selectedSubmittalId) || null;
  }, [selectedSubmittalId, submittalsData]);

  // Transform to full Submittal type for detail panel
  const selectedSubmittalFull = useMemo(() => {
    if (!selectedSubmittalRaw) return null;
    return transformToFullSubmittal(selectedSubmittalRaw);
  }, [selectedSubmittalRaw]);

  // Transform API data to display format
  const submittals: SubmittalDisplay[] = useMemo(() => {
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

  // Stats - calculated from ALL submittals, not the filtered list
  const stats: SubmittalsStats = useMemo(() => {
    if (!allSubmittalsData) return { total: 0, draft: 0, forApproval: 0, approved: 0 };
    const allSubmittals = allSubmittalsData.map(transformSubmittalResponse);
    const total = allSubmittals.length;
    const draft = allSubmittals.filter(s => s.status === 'draft').length;
    const forApproval = allSubmittals.filter(s => s.status === 'for_approval' || s.status === 'resubmit_for_approval').length;
    const approved = allSubmittals.filter(s => s.status === 'approved' || s.status === 'approved_as_noted' || s.status === 'approved_as_submitted').length;
    return { total, draft, forApproval, approved };
  }, [allSubmittalsData]);

  // Get handlers from the handlers hook
  const handlers = useSubmittalHandlers({
    selectedSubmittalId,
    selectedSubmittalFull,
    updateSubmittalMutation,
    deleteSubmittalMutation,
    updateSubmittalItemMutation,
    createSubmittalMutation,
    addSubmittalItemMutation,
    removeSubmittalItemMutation,
    addSubmittalStakeholderMutation,
    removeSubmittalStakeholderMutation,
    refetch,
    setShowCreateModal,
    setIsEditingItem,
    setSelectedSubmittalId,
  });

  return {
    // State
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedSubmittalId,
    setSelectedSubmittalId,
    viewMode,
    setViewMode,
    showCreateModal,
    setShowCreateModal,
    showPrintDialog,
    setShowPrintDialog,
    isEditingItem,

    // Data
    submittals,
    filteredSubmittals,
    selectedSubmittalFull,
    stats,
    isLoading,
    error,

    // Loading states
    isSavingSettings: updateSubmittalMutation.isPending,
    isAddingStakeholder: addSubmittalStakeholderMutation.isPending,

    // Handlers
    ...handlers,

    // PDF generation
    generatePdfMutation,

    // Refetch function
    refetch,
  };
}
