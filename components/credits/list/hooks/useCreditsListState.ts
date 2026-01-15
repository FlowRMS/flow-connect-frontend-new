/**
 * useCreditsListState Hook
 * Manages credits state for the standalone credits page
 * with infinite scroll pagination and search functionality
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  type Credit,
  type CreditLandingPage,
  type CreateCreditInput,
  useCreditsInfinite,
  useCreditSearch,
  useCreateCredit,
  useUpdateCredit,
  useDeleteCredit,
  fetchCreditById,
  fetchAllCreditIds,
} from '@/components/orders/api/creditsApi';
import { useBulkSelection } from '@/components/shared';

export function useCreditsListState() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch credits from API with infinite scroll
  const {
    data: creditsData,
    isLoading: isLoadingCredits,
    error: creditsError,
    refetch: refetchCredits,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCreditsInfinite();

  // Search credits - only when search query has 2+ characters
  const { data: searchResults, isLoading: isSearching } = useCreditSearch(
    searchQuery,
    100
  );

  // Flatten paginated data
  const allCreditsData = useMemo(() => {
    if (!creditsData?.pages) return [];
    return creditsData.pages.flatMap(page => page.records);
  }, [creditsData]);

  // Get total count
  const totalCount = useMemo(() => {
    if (!creditsData?.pages || creditsData.pages.length === 0) return 0;
    return creditsData.pages[0].total;
  }, [creditsData]);

  // Use search results when searching, otherwise use paginated data
  const credits = useMemo(() => {
    if (searchQuery.length >= 2 && searchResults) {
      // Transform search results to match CreditLandingPage shape
      return searchResults.map((result): CreditLandingPage => ({
        id: result.id,
        creditNumber: result.creditNumber,
        creditType: result.creditType,
        createdAt: result.createdAt,
        entityDate: result.entityDate,
        locked: result.locked,
        reason: result.reason,
        status: result.status,
        orderId: result.orderId,
      }));
    }
    return allCreditsData;
  }, [allCreditsData, searchQuery, searchResults]);

  // Scroll handler for infinite scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    // Load more when within 200px of bottom
    if (scrollHeight - scrollTop - clientHeight < 200) {
      if (hasNextPage && !isFetchingNextPage && !searchQuery) {
        fetchNextPage();
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, searchQuery]);

  // Mutations
  const createCreditMutation = useCreateCredit();
  const updateCreditMutation = useUpdateCredit();
  const deleteCreditMutation = useDeleteCredit();

  // Bulk selection - supports selecting all credits including unloaded ones
  const bulkSelection = useBulkSelection({
    items: credits,
    totalCount,
    fetchAllIds: fetchAllCreditIds,
  });

  // Bulk delete modal state
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Handle bulk delete success
  const handleBulkDeleteSuccess = useCallback(() => {
    bulkSelection.clearSelection();
    setShowBulkDeleteModal(false);
    refetchCredits();
  }, [bulkSelection, refetchCredits]);

  // Modal states
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showCreditDetailModal, setShowCreditDetailModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<CreditLandingPage | null>(null);
  const [creditToEdit, setCreditToEdit] = useState<Credit | null>(null);
  const [creditToDelete, setCreditToDelete] = useState<CreditLandingPage | null>(null);
  const [isLoadingCreditDetails, setIsLoadingCreditDetails] = useState(false);

  // Open create credit modal
  const openCreateCreditModal = useCallback(() => {
    setCreditToEdit(null);
    setShowCreditModal(true);
  }, []);

  // Open edit credit modal - fetches full credit data with details
  const openEditCreditModal = useCallback(async (credit: CreditLandingPage) => {
    setIsLoadingCreditDetails(true);
    setShowCreditModal(true);

    try {
      // Fetch full credit data including details
      const fullCredit = await fetchCreditById(credit.id);
      if (fullCredit) {
        setCreditToEdit(fullCredit);
      }
    } catch (error) {
      console.error('Error fetching credit details:', error);
      // Fall back to just opening the modal without full details
    } finally {
      setIsLoadingCreditDetails(false);
    }
  }, []);

  // Close credit modal
  const closeCreditModal = useCallback(() => {
    setShowCreditModal(false);
    setCreditToEdit(null);
  }, []);

  // Open credit detail modal
  const openCreditDetailModal = useCallback((credit: CreditLandingPage) => {
    setSelectedCredit(credit);
    setShowCreditDetailModal(true);
  }, []);

  // Close credit detail modal
  const closeCreditDetailModal = useCallback(() => {
    setShowCreditDetailModal(false);
    setSelectedCredit(null);
  }, []);

  // Helper to extract error message from GraphQL errors
  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message: string }).message;
      // Check for specific error messages
      if (message.includes('Cannot modify a posted credit')) {
        return 'Cannot modify a posted credit. Please void the credit first.';
      }
      if (message.includes('Cannot delete a posted credit')) {
        return 'Cannot delete a posted credit. Please void the credit first.';
      }
      return message;
    }
    return 'An unexpected error occurred';
  };

  // Handle create/update credit
  const handleSaveCredit = useCallback(async (input: CreateCreditInput) => {
    try {
      if (creditToEdit) {
        // Update existing credit
        await updateCreditMutation.mutateAsync({
          ...input,
          id: creditToEdit.id,
        });
        toast.success('Credit updated successfully');
      } else {
        // Create new credit
        await createCreditMutation.mutateAsync(input);
        toast.success('Credit created successfully');
      }
      closeCreditModal();
      refetchCredits();
    } catch (error) {
      console.error('Error saving credit:', error);
      toast.error(getErrorMessage(error));
      throw error;
    }
  }, [creditToEdit, createCreditMutation, updateCreditMutation, closeCreditModal, refetchCredits]);

  // Open delete confirmation modal
  const openDeleteConfirmModal = useCallback((credit: CreditLandingPage) => {
    setCreditToDelete(credit);
    setShowDeleteConfirmModal(true);
  }, []);

  // Close delete confirmation modal
  const closeDeleteConfirmModal = useCallback(() => {
    setShowDeleteConfirmModal(false);
    setCreditToDelete(null);
  }, []);

  // Handle delete credit (called from confirmation modal)
  const handleConfirmDelete = useCallback(async () => {
    if (!creditToDelete) return;

    try {
      await deleteCreditMutation.mutateAsync(creditToDelete.id);
      toast.success('Credit deleted successfully');
      closeDeleteConfirmModal();
      closeCreditDetailModal();
      refetchCredits();
    } catch (error) {
      console.error('Error deleting credit:', error);
      toast.error(getErrorMessage(error));
    }
  }, [creditToDelete, deleteCreditMutation, closeDeleteConfirmModal, closeCreditDetailModal, refetchCredits]);

  // Handle delete credit request (opens confirmation modal)
  const handleDeleteCredit = useCallback((credit: CreditLandingPage) => {
    openDeleteConfirmModal(credit);
  }, [openDeleteConfirmModal]);

  // View credit details
  const viewCredit = useCallback((credit: CreditLandingPage) => {
    openCreditDetailModal(credit);
  }, [openCreditDetailModal]);

  // Edit credit from detail modal
  const editCreditFromDetail = useCallback(() => {
    if (selectedCredit) {
      closeCreditDetailModal();
      openEditCreditModal(selectedCredit);
    }
  }, [selectedCredit, closeCreditDetailModal, openEditCreditModal]);

  // Delete credit from detail modal
  const deleteCreditFromDetail = useCallback(async () => {
    if (selectedCredit) {
      await handleDeleteCredit(selectedCredit);
    }
  }, [selectedCredit, handleDeleteCredit]);

  return {
    // Data
    credits,
    isLoadingCredits,
    creditsError,
    refetchCredits,

    // Pagination
    totalCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    handleScroll,

    // Search
    searchQuery,
    setSearchQuery,
    isSearching,

    // Modal states
    showCreditModal,
    showCreditDetailModal,
    showDeleteConfirmModal,
    selectedCredit,
    creditToEdit,
    creditToDelete,
    isLoadingCreditDetails,

    // Modal actions
    openCreateCreditModal,
    openEditCreditModal,
    closeCreditModal,
    openCreditDetailModal,
    closeCreditDetailModal,
    closeDeleteConfirmModal,

    // CRUD actions
    handleSaveCredit,
    handleDeleteCredit,
    handleConfirmDelete,
    viewCredit,
    editCreditFromDetail,
    deleteCreditFromDetail,

    // Mutation states
    isSavingCredit: createCreditMutation.isPending || updateCreditMutation.isPending,
    isDeletingCredit: deleteCreditMutation.isPending,

    // Bulk selection
    selectAllMode: bulkSelection.selectAllMode,
    selectedCount: bulkSelection.selectedCount,
    isAllSelected: bulkSelection.isAllSelected,
    isPartiallySelected: bulkSelection.isPartiallySelected,
    isItemSelected: bulkSelection.isItemSelected,
    handleSelectAll: bulkSelection.handleSelectAll,
    handleSelectOne: bulkSelection.handleSelectOne,
    clearSelection: bulkSelection.clearSelection,
    getAllSelectedIds: bulkSelection.getAllSelectedIds,

    // Bulk delete modal
    showBulkDeleteModal,
    setShowBulkDeleteModal,
    handleBulkDeleteSuccess,
  };
}
