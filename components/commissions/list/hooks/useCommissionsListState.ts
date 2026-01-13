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
  type UpdateCheckInput,
  type CheckStatus,
  useChecksInfinite,
  useCreateCheck,
  useUpdateCheck,
  useDeleteCheck,
  fetchCheckById,
} from '@/components/orders/api/checksApi';
import { unpostCheck } from '@/components/lib/graphql/checks';
import { useCommissionFilters } from './useCommissionFilters';
import { useBulkSelection } from '../../../shared';
import { fetchAllCheckIds } from '@/components/orders/api/checksApi';

export function useCommissionsListState() {
  // Fetch checks from real API with infinite scroll
  const {
    data: checksData,
    isLoading: isLoadingChecks,
    error: checksError,
    refetch: refetchChecks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChecksInfinite();

  // Flatten paginated data
  const allChecksData = useMemo(() => {
    if (!checksData?.pages) return [];
    return checksData.pages.flatMap(page => page.records);
  }, [checksData]);

  // Get total count
  const totalCount = useMemo(() => {
    if (!checksData?.pages || checksData.pages.length === 0) return 0;
    return checksData.pages[0].total;
  }, [checksData]);

  // Scroll handler for infinite scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    // Load more when within 200px of bottom
    if (scrollHeight - scrollTop - clientHeight < 200) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Convert API data to CommissionCheck format for compatibility
  const checks: CommissionCheck[] = useMemo(() => {
    if (!allChecksData.length) return [];
    const now = new Date().toISOString();
    return allChecksData.map((check) => ({
      id: check.id,
      checkNumber: check.checkNumber || '',
      salesRepId: '',
      salesRepName: '',
      manufacturerId: '',
      manufacturerName: check.factoryName || '',
      commissionMonth: check.commissionMonth || '',
      status: (check.status || 'OPEN') as 'OPEN' | 'POSTED' | 'VOID',
      postDate: check.postDate || '',
      checkDate: check.checkDate || '',
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
  }, [allChecksData]);

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

  // Sidebar action states
  const [isUpdatingCheck, setIsUpdatingCheck] = useState(false);

  // Bulk action states
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [showBulkActionsMenu, setShowBulkActionsMenu] = useState(false);

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

  // Handle post check from sidebar panel
  const handlePostCheck = useCallback(async (checkId: string) => {
    setIsUpdatingCheck(true);
    try {
      // Fetch full check details first
      const fullCheck = await fetchCheckById(checkId);
      if (!fullCheck) {
        throw new Error('Check not found');
      }

      // Update status to POSTED
      await updateCheckMutation.mutateAsync({
        id: fullCheck.id,
        checkNumber: fullCheck.checkNumber,
        entityDate: fullCheck.entityDate || new Date().toISOString().split('T')[0],
        enteredCommissionAmount: fullCheck.enteredCommissionAmount || '0',
        factoryId: fullCheck.factoryId || '',
        commissionMonth: fullCheck.commissionMonth,
        postDate: fullCheck.postDate,
        status: 'POSTED',
        creationType: fullCheck.creationType || 'MANUAL',
        details: fullCheck.details?.map(d => ({
          id: d.id,
          invoiceId: d.invoiceId,
          creditId: d.creditId,
          adjustmentId: d.adjustmentId,
          appliedAmount: d.appliedAmount || '0',
        })) || [],
      });
      toast.success('Check posted successfully');
      setSelectedCheck(null);
      refetchChecks();
    } catch (error) {
      console.error('Error posting check:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsUpdatingCheck(false);
    }
  }, [updateCheckMutation, refetchChecks]);

  // Handle unpost check from sidebar panel
  const handleUnpostCheck = useCallback(async (checkId: string) => {
    setIsUpdatingCheck(true);
    try {
      await unpostCheck(checkId);
      toast.success('Check unposted successfully');
      setSelectedCheck(null);
      refetchChecks();
    } catch (error) {
      console.error('Error unposting check:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsUpdatingCheck(false);
    }
  }, [refetchChecks]);

  // Integrate filter hook
  const filterState = useCommissionFilters(checks);

  // Integrate bulk selection hook
  const bulkSelection = useBulkSelection({
    items: checks,
    totalCount,
    fetchAllIds: fetchAllCheckIds,
  });

  // Compatibility layer for existing code
  const selectedCheckIds = bulkSelection.selectedIds;
  const toggleCheckSelection = useCallback((checkId: string) => {
    bulkSelection.handleSelectOne(checkId, !bulkSelection.isItemSelected(checkId));
  }, [bulkSelection]);
  const selectAllChecks = useCallback(() => {
    bulkSelection.handleSelectAll(true);
  }, [bulkSelection]);
  const clearSelection = bulkSelection.clearSelection;
  const isCheckSelected = bulkSelection.isItemSelected;
  const areAllEligibleSelected = bulkSelection.isAllSelected;

  // Bulk set status - update each check one by one via API
  const bulkSetStatus = useCallback(async (status: CheckStatus) => {
    const selectedIds = Array.from(bulkSelection.selectedIds);
    if (selectedIds.length === 0) return;

    setIsBulkUpdating(true);
    setShowBulkActionsMenu(false);

    let successCount = 0;
    let errorCount = 0;

    for (const checkId of selectedIds) {
      try {
        if (status === 'POSTED') {
          // Fetch full check details first
          const fullCheck = await fetchCheckById(checkId);
          if (!fullCheck) {
            errorCount++;
            continue;
          }

          await updateCheckMutation.mutateAsync({
            id: fullCheck.id,
            checkNumber: fullCheck.checkNumber,
            entityDate: fullCheck.entityDate || new Date().toISOString().split('T')[0],
            enteredCommissionAmount: fullCheck.enteredCommissionAmount || '0',
            factoryId: fullCheck.factoryId || '',
            commissionMonth: fullCheck.commissionMonth,
            postDate: fullCheck.postDate,
            status: 'POSTED',
            creationType: fullCheck.creationType || 'MANUAL',
            details: fullCheck.details?.map(d => ({
              id: d.id,
              invoiceId: d.invoiceId,
              creditId: d.creditId,
              adjustmentId: d.adjustmentId,
              appliedAmount: d.appliedAmount || '0',
            })) || [],
          });
          successCount++;
        } else if (status === 'OPEN') {
          // Use unpost mutation
          await unpostCheck(checkId);
          successCount++;
        }
      } catch (error) {
        console.error(`Error updating check ${checkId}:`, error);
        errorCount++;
      }
    }

    setIsBulkUpdating(false);
    bulkSelection.clearSelection();

    if (successCount > 0) {
      toast.success(`${successCount} check(s) updated successfully`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to update ${errorCount} check(s)`);
    }

    refetchChecks();
  }, [bulkSelection, updateCheckMutation, refetchChecks]);

  // Bulk delete - delete each check one by one via API
  const bulkDelete = useCallback(async () => {
    const selectedIds = Array.from(bulkSelection.selectedIds);
    if (selectedIds.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} check(s)? This action cannot be undone.`)) {
      return;
    }

    setIsBulkUpdating(true);
    setShowBulkActionsMenu(false);

    let successCount = 0;
    let errorCount = 0;

    for (const checkId of selectedIds) {
      try {
        await deleteCheckMutation.mutateAsync(checkId);
        successCount++;
      } catch (error) {
        console.error(`Error deleting check ${checkId}:`, error);
        errorCount++;
      }
    }

    setIsBulkUpdating(false);
    bulkSelection.clearSelection();

    if (successCount > 0) {
      toast.success(`${successCount} check(s) deleted successfully`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to delete ${errorCount} check(s). Posted checks cannot be deleted.`);
    }

    refetchChecks();
  }, [bulkSelection, deleteCheckMutation, refetchChecks]);

  return {
    // Checks data
    checks,
    isLoadingChecks,
    checksError,
    refetchChecks,
    totalCount,

    // Infinite scroll
    handleScroll,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,

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

    // Sidebar panel actions
    handlePostCheck,
    handleUnpostCheck,
    isUpdatingCheck,

    // Mutation states
    isSavingCheck: createCheckMutation.isPending || updateCheckMutation.isPending,
    isDeletingCheck: deleteCheckMutation.isPending,

    // Filter state and actions
    ...filterState,

    // Selection state and actions (compatibility layer)
    selectedCheckIds,
    toggleCheckSelection,
    selectAllChecks,
    clearSelection,
    isCheckSelected,
    areAllEligibleSelected,
    // New bulk selection values
    isItemSelected: bulkSelection.isItemSelected,
    isAllSelected: bulkSelection.isAllSelected,
    isPartiallySelected: bulkSelection.isPartiallySelected,
    handleSelectAll: bulkSelection.handleSelectAll,
    handleSelectOne: bulkSelection.handleSelectOne,
    selectAllMode: bulkSelection.selectAllMode,
    selectedCount: bulkSelection.selectedCount,
    getAllSelectedIds: bulkSelection.getAllSelectedIds,

    // Bulk actions
    showBulkActionsMenu,
    setShowBulkActionsMenu,
    bulkSetStatus,
    bulkDelete,
    isBulkUpdating,
  };
}
