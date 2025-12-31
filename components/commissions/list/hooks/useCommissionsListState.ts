/**
 * useCommissionsListState Hook
 * Main state management hook for the commissions list
 * Integrates all sub-hooks and manages overall state
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { CommissionCheck } from '@/lib/types/rms';
import {
  type Check,
  type CheckLandingPage,
  type CreateCheckInput,
  useChecksLandingPage,
  useCreateCheck,
  useUpdateCheck,
  useDeleteCheck,
  fetchCheckById,
} from '@/components/orders/api/checksApi';
import { useCommissionFilters } from './useCommissionFilters';
import { useCommissionSelection } from './useCommissionSelection';
import { useCommissionBulkActions } from './useCommissionBulkActions';

export function useCommissionsListState() {
  // Fetch checks from real API
  const {
    data: checksData,
    isLoading: isLoadingChecks,
    error: checksError,
    refetch: refetchChecks,
  } = useChecksLandingPage();

  // Convert API data to CommissionCheck format for compatibility
  const checks: CommissionCheck[] = useMemo(() => {
    if (!checksData?.records) return [];
    const now = new Date().toISOString();
    return checksData.records.map((check) => ({
      id: check.id,
      checkNumber: check.checkNumber || '',
      salesRepId: '',
      salesRepName: '',
      manufacturerId: '',
      manufacturerName: check.factoryName || '',
      commissionMonth: check.commissionMonth || '',
      status: check.status === 'POSTED' ? 'posted' as const : 'draft' as const,
      postDate: '',
      checkDate: '',
      entryDate: check.createdAt || now,
      createdDate: check.createdAt || now,
      details: [],
      invoicePayments: 0,
      expenseAdjustments: 0,
      creditDeductions: 0,
      netAmount: parseFloat(check.enteredCommissionAmount || '0'),
      checkBalance: 0,
      createdBy: check.createdBy || '',
    }));
  }, [checksData]);

  // Mutations
  const createCheckMutation = useCreateCheck();
  const updateCheckMutation = useUpdateCheck();
  const deleteCheckMutation = useDeleteCheck();

  // Selected check for detail panel
  const [selectedCheck, setSelectedCheck] = useState<CommissionCheck | null>(null);

  // Modal states
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [checkToEdit, setCheckToEdit] = useState<Check | null>(null);
  const [checkToDelete, setCheckToDelete] = useState<CommissionCheck | null>(null);
  const [isLoadingCheckDetails, setIsLoadingCheckDetails] = useState(false);

  // Open create check modal
  const openCreateCheckModal = useCallback(() => {
    setCheckToEdit(null);
    setShowCheckModal(true);
  }, []);

  // Open edit check modal - fetches full check data
  const openEditCheckModal = useCallback(async (check: CommissionCheck) => {
    setIsLoadingCheckDetails(true);
    setShowCheckModal(true);

    try {
      const fullCheck = await fetchCheckById(check.id);
      if (fullCheck) {
        setCheckToEdit(fullCheck);
      }
    } catch (error) {
      console.error('Error fetching check details:', error);
      toast.error('Failed to load check details');
    } finally {
      setIsLoadingCheckDetails(false);
    }
  }, []);

  // Close check modal
  const closeCheckModal = useCallback(() => {
    setShowCheckModal(false);
    setCheckToEdit(null);
  }, []);

  // Helper to extract error message
  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message: string }).message;
      if (message.includes('Cannot modify a posted check')) {
        return 'Cannot modify a posted check.';
      }
      if (message.includes('Cannot delete a posted check')) {
        return 'Cannot delete a posted check.';
      }
      return message;
    }
    return 'An unexpected error occurred';
  };

  // Handle create/update check
  const handleSaveCheck = useCallback(async (input: CreateCheckInput) => {
    try {
      if (checkToEdit) {
        await updateCheckMutation.mutateAsync({
          ...input,
          id: checkToEdit.id,
        });
        toast.success('Check updated successfully');
      } else {
        await createCheckMutation.mutateAsync(input);
        toast.success('Check created successfully');
      }
      closeCheckModal();
      refetchChecks();
    } catch (error) {
      console.error('Error saving check:', error);
      toast.error(getErrorMessage(error));
      throw error;
    }
  }, [checkToEdit, createCheckMutation, updateCheckMutation, closeCheckModal, refetchChecks]);

  // Open delete confirmation modal
  const openDeleteConfirmModal = useCallback((check: CommissionCheck) => {
    setCheckToDelete(check);
    setShowDeleteConfirmModal(true);
  }, []);

  // Close delete confirmation modal
  const closeDeleteConfirmModal = useCallback(() => {
    setShowDeleteConfirmModal(false);
    setCheckToDelete(null);
  }, []);

  // Handle confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!checkToDelete) return;

    try {
      await deleteCheckMutation.mutateAsync(checkToDelete.id);
      toast.success('Check deleted successfully');
      closeDeleteConfirmModal();
      setSelectedCheck(null);
      refetchChecks();
    } catch (error) {
      console.error('Error deleting check:', error);
      toast.error(getErrorMessage(error));
    }
  }, [checkToDelete, deleteCheckMutation, closeDeleteConfirmModal, refetchChecks]);

  // Handle delete check request
  const handleDeleteCheck = useCallback((check: CommissionCheck) => {
    openDeleteConfirmModal(check);
  }, [openDeleteConfirmModal]);

  // Integrate filter hook
  const filterState = useCommissionFilters(checks);

  // Integrate selection hook
  const selectionState = useCommissionSelection();

  // Integrate bulk actions hook - create a no-op setChecks since we use API
  const bulkActionsState = useCommissionBulkActions({
    selectedCheckIds: selectionState.selectedCheckIds,
    clearSelection: selectionState.clearSelection,
    setChecks: () => {}, // No-op since we use API
  });

  return {
    // Checks data
    checks,
    isLoadingChecks,
    checksError,
    refetchChecks,

    // Selected check for sidebar
    selectedCheck,
    setSelectedCheck,

    // Modal states
    showCheckModal,
    showDeleteConfirmModal,
    checkToEdit,
    checkToDelete,
    isLoadingCheckDetails,

    // Modal actions
    openCreateCheckModal,
    openEditCheckModal,
    closeCheckModal,
    closeDeleteConfirmModal,

    // CRUD actions
    handleSaveCheck,
    handleDeleteCheck,
    handleConfirmDelete,

    // Mutation states
    isSavingCheck: createCheckMutation.isPending || updateCheckMutation.isPending,
    isDeletingCheck: deleteCheckMutation.isPending,

    // Filter state and actions
    ...filterState,

    // Selection state and actions
    ...selectionState,

    // Bulk actions state and actions
    ...bulkActionsState,
  };
}

