/**
 * useAdjustmentsListState Hook
 * Manages adjustments state for the standalone adjustments page
 * with infinite scroll pagination and search functionality
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  type Adjustment,
  type AdjustmentLandingPage,
  type AdjustmentStatus,
  type CreateAdjustmentInput,
  useAdjustmentsInfinite,
  useAdjustmentSearch,
  useCreateAdjustment,
  useUpdateAdjustment,
  useDeleteAdjustment,
  fetchAdjustmentById,
} from '@/components/orders/api/adjustmentsApi';

export function useAdjustmentsListState() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quick filter state (status filter)
  const [statusFilter, setStatusFilter] = useState<AdjustmentStatus | 'ALL'>('ALL');

  // Build filters for API based on quick filters
  const apiFilters = useMemo(() => {
    const filters: Array<{ columnName: string; operator: string; value: string }> = [];
    
    // Add status filter if not 'ALL'
    if (statusFilter !== 'ALL') {
      filters.push({
        columnName: 'status',
        operator: 'EQ',
        value: statusFilter,
      });
    }
    
    return filters;
  }, [statusFilter]);

  // Fetch adjustments from API with infinite scroll
  const {
    data: adjustmentsData,
    isLoading: isLoadingAdjustments,
    error: adjustmentsError,
    refetch: refetchAdjustments,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdjustmentsInfinite(apiFilters.length > 0 ? apiFilters : undefined);

  // Search adjustments - only when search query has 2+ characters
  const { data: searchResults, isLoading: isSearching } = useAdjustmentSearch(
    searchQuery,
    100
  );

  // Flatten paginated data
  const allAdjustmentsData = useMemo(() => {
    if (!adjustmentsData?.pages) return [];
    return adjustmentsData.pages.flatMap(page => page.records);
  }, [adjustmentsData]);

  // Get total count
  const totalCount = useMemo(() => {
    if (!adjustmentsData?.pages || adjustmentsData.pages.length === 0) return 0;
    return adjustmentsData.pages[0].total;
  }, [adjustmentsData]);

  // Use search results when searching, otherwise use paginated data
  const adjustments = useMemo(() => {
    if (searchQuery.length >= 2 && searchResults) {
      // Transform search results to match AdjustmentLandingPage shape
      return searchResults.map((result): AdjustmentLandingPage => ({
        id: result.id,
        adjustmentNumber: result.adjustmentNumber,
        amount: result.amount,
        createdAt: result.createdAt,
        entityDate: result.entityDate,
        locked: result.locked,
        reason: result.reason,
        status: result.status,
      }));
    }
    return allAdjustmentsData;
  }, [allAdjustmentsData, searchQuery, searchResults]);

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
  const createAdjustmentMutation = useCreateAdjustment();
  const updateAdjustmentMutation = useUpdateAdjustment();
  const deleteAdjustmentMutation = useDeleteAdjustment();

  // Modal states
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showAdjustmentDetailModal, setShowAdjustmentDetailModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<AdjustmentLandingPage | null>(null);
  const [adjustmentToEdit, setAdjustmentToEdit] = useState<Adjustment | null>(null);
  const [adjustmentToDelete, setAdjustmentToDelete] = useState<AdjustmentLandingPage | null>(null);
  const [isLoadingAdjustmentDetails, setIsLoadingAdjustmentDetails] = useState(false);

  // Open create adjustment modal
  const openCreateAdjustmentModal = useCallback(() => {
    setAdjustmentToEdit(null);
    setShowAdjustmentModal(true);
  }, []);

  // Open edit adjustment modal - fetches full adjustment data with details
  const openEditAdjustmentModal = useCallback(async (adjustment: AdjustmentLandingPage) => {
    setIsLoadingAdjustmentDetails(true);
    setShowAdjustmentModal(true);

    try {
      // Fetch full adjustment data including split rates
      const fullAdjustment = await fetchAdjustmentById(adjustment.id);
      if (fullAdjustment) {
        setAdjustmentToEdit(fullAdjustment);
      }
    } catch (error) {
      console.error('Error fetching adjustment details:', error);
      // Fall back to just opening the modal without full details
    } finally {
      setIsLoadingAdjustmentDetails(false);
    }
  }, []);

  // Close adjustment modal
  const closeAdjustmentModal = useCallback(() => {
    setShowAdjustmentModal(false);
    setAdjustmentToEdit(null);
  }, []);

  // Open adjustment detail modal
  const openAdjustmentDetailModal = useCallback((adjustment: AdjustmentLandingPage) => {
    setSelectedAdjustment(adjustment);
    setShowAdjustmentDetailModal(true);
  }, []);

  // Close adjustment detail modal
  const closeAdjustmentDetailModal = useCallback(() => {
    setShowAdjustmentDetailModal(false);
    setSelectedAdjustment(null);
  }, []);

  // Helper to extract error message from GraphQL errors
  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message: string }).message;
      // Check for specific error messages
      if (message.includes('Cannot modify a posted adjustment')) {
        return 'Cannot modify a posted adjustment. Please void the adjustment first.';
      }
      if (message.includes('Cannot delete a posted adjustment')) {
        return 'Cannot delete a posted adjustment. Please void the adjustment first.';
      }
      return message;
    }
    return 'An unexpected error occurred';
  };

  // Handle create/update adjustment
  const handleSaveAdjustment = useCallback(async (input: CreateAdjustmentInput) => {
    try {
      if (adjustmentToEdit) {
        // Update existing adjustment
        await updateAdjustmentMutation.mutateAsync({
          ...input,
          id: adjustmentToEdit.id,
        });
        toast.success('Adjustment updated successfully');
      } else {
        // Create new adjustment
        await createAdjustmentMutation.mutateAsync(input);
        toast.success('Adjustment created successfully');
      }
      closeAdjustmentModal();
      refetchAdjustments();
    } catch (error) {
      console.error('Error saving adjustment:', error);
      toast.error(getErrorMessage(error));
      throw error;
    }
  }, [adjustmentToEdit, createAdjustmentMutation, updateAdjustmentMutation, closeAdjustmentModal, refetchAdjustments]);

  // Open delete confirmation modal
  const openDeleteConfirmModal = useCallback((adjustment: AdjustmentLandingPage) => {
    setAdjustmentToDelete(adjustment);
    setShowDeleteConfirmModal(true);
  }, []);

  // Close delete confirmation modal
  const closeDeleteConfirmModal = useCallback(() => {
    setShowDeleteConfirmModal(false);
    setAdjustmentToDelete(null);
  }, []);

  // Handle delete adjustment (called from confirmation modal)
  const handleConfirmDelete = useCallback(async () => {
    if (!adjustmentToDelete) return;

    try {
      await deleteAdjustmentMutation.mutateAsync(adjustmentToDelete.id);
      toast.success('Adjustment deleted successfully');
      closeDeleteConfirmModal();
      closeAdjustmentDetailModal();
      refetchAdjustments();
    } catch (error) {
      console.error('Error deleting adjustment:', error);
      toast.error(getErrorMessage(error));
    }
  }, [adjustmentToDelete, deleteAdjustmentMutation, closeDeleteConfirmModal, closeAdjustmentDetailModal, refetchAdjustments]);

  // Handle delete adjustment request (opens confirmation modal)
  const handleDeleteAdjustment = useCallback((adjustment: AdjustmentLandingPage) => {
    openDeleteConfirmModal(adjustment);
  }, [openDeleteConfirmModal]);

  // View adjustment details
  const viewAdjustment = useCallback((adjustment: AdjustmentLandingPage) => {
    openAdjustmentDetailModal(adjustment);
  }, [openAdjustmentDetailModal]);

  // Edit adjustment from detail modal
  const editAdjustmentFromDetail = useCallback(() => {
    if (selectedAdjustment) {
      closeAdjustmentDetailModal();
      openEditAdjustmentModal(selectedAdjustment);
    }
  }, [selectedAdjustment, closeAdjustmentDetailModal, openEditAdjustmentModal]);

  // Delete adjustment from detail modal
  const deleteAdjustmentFromDetail = useCallback(async () => {
    if (selectedAdjustment) {
      await handleDeleteAdjustment(selectedAdjustment);
    }
  }, [selectedAdjustment, handleDeleteAdjustment]);

  return {
    // Data
    adjustments,
    isLoadingAdjustments,
    adjustmentsError,
    refetchAdjustments,

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
    
    // Quick filters
    statusFilter,
    setStatusFilter,

    // Modal states
    showAdjustmentModal,
    showAdjustmentDetailModal,
    showDeleteConfirmModal,
    selectedAdjustment,
    adjustmentToEdit,
    adjustmentToDelete,
    isLoadingAdjustmentDetails,

    // Modal actions
    openCreateAdjustmentModal,
    openEditAdjustmentModal,
    closeAdjustmentModal,
    openAdjustmentDetailModal,
    closeAdjustmentDetailModal,
    closeDeleteConfirmModal,

    // CRUD actions
    handleSaveAdjustment,
    handleDeleteAdjustment,
    handleConfirmDelete,
    viewAdjustment,
    editAdjustmentFromDetail,
    deleteAdjustmentFromDetail,

    // Mutation states
    isSavingAdjustment: createAdjustmentMutation.isPending || updateAdjustmentMutation.isPending,
    isDeletingAdjustment: deleteAdjustmentMutation.isPending,
  };
}
