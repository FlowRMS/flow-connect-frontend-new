/**
 * useAdjustmentsListState Hook
 * Manages adjustments state for the standalone adjustments page
 * with infinite scroll pagination and search functionality
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import type { ActiveFilter } from '@/components/advancedFilters/AdvancedFilters';
import { useFilterSync } from '@/components/advancedFilters/hooks/useFilterSync';
import { getAdjustmentFilterOptions } from '../config/filterConfig';

const DEFAULT_PAGE_SIZE = 50;
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
  
  // Advanced filters state
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  
  // Column filters state
  const [columnFilters, setColumnFilters] = useState<Record<string, ActiveFilter[]>>({});
  
  // Server-side sorting state
  const [serverOrderBy, setServerOrderBy] = useState<Array<{ columnName: string; direction: 'ASC' | 'DESC' }>>(() => {
    return [{
      columnName: 'createdAt',
      direction: 'DESC',
    }];
  });
  
  // Refs to prevent infinite loops when syncing
  const isSyncingFromAdvanced = useRef(false);
  const isSyncingFromColumn = useRef(false);
  
  // Map from UI column keys to filter option IDs
  const columnKeyToFilterId: Record<string, string> = useMemo(() => ({
    adjustmentNumber: 'adjustment-number',
    entityDate: 'adjustment-date',
    amount: 'amount',
    status: 'status',
    locked: 'locked',
  }), []);
  
  // Filter options for sync
  const adjustmentFilterOptionsForSync = useMemo(() => {
    return getAdjustmentFilterOptions();
  }, []);
  
  // Hook for synchronizing filters between AdvancedFilters and ColumnFilters
  const { syncAdvancedToColumn, syncColumnToAdvanced } = useFilterSync({
    filterOptions: adjustmentFilterOptionsForSync,
    columnKeyToFilterId,
  });

  // Convert ActiveFilter to API filter format
  const toServerFilters = useCallback((filters: ActiveFilter[]): Array<{ columnName: string; operator: string; value?: string; values?: string[] }> => {
    return filters.map(f => {
      // Only include value OR values, not both - check which one exists
      if (f.values && f.values.length > 0) {
        return {
          operator: f.operator,
          columnName: f.columnName,
          values: f.values,
        };
      }
      return {
        operator: f.operator,
        columnName: f.columnName,
        value: f.value,
      };
    });
  }, []);

  // Build filters for API - combine quick filters, advanced filters, and column filters
  const apiFilters = useMemo(() => {
    const filters: Array<{ columnName: string; operator: string; value?: string; values?: string[] }> = [];
    
    // Add status filter if not 'ALL'
    // Note: We add it from statusFilter OR from columnFilters, but not both to avoid duplicates
    // Since they're synced, we prefer statusFilter for consistency
    if (statusFilter !== 'ALL') {
      filters.push({
        columnName: 'status',
        operator: 'EQ',
        value: statusFilter,
      });
    }
    
    // Add advanced filters
    const advancedFilters = toServerFilters(activeFilters);
    filters.push(...advancedFilters);
    
    // Add column filters - flatten all column filters into a single array
    const allColumnFilters: ActiveFilter[] = [];
    Object.values(columnFilters).forEach((filters) => {
      allColumnFilters.push(...filters);
    });
    const columnFiltersForApi = toServerFilters(allColumnFilters);
    filters.push(...columnFiltersForApi);
    
    return filters;
  }, [statusFilter, activeFilters, columnFilters, toServerFilters]);

  // Fetch adjustments from API with infinite scroll
  const {
    data: adjustmentsData,
    isLoading: isLoadingAdjustments,
    error: adjustmentsError,
    refetch: refetchAdjustments,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdjustmentsInfinite(
    apiFilters.length > 0 ? apiFilters : undefined,
    DEFAULT_PAGE_SIZE,
    serverOrderBy
  );

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

  // Handler for advanced filters changes (from AdvancedFilters component)
  const handleAdvancedFiltersChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    
    // Sync to ColumnFilters (most recent filter replaces previous one for same column)
    // Only sync if not already syncing from column filters to avoid infinite loop
    if (!isSyncingFromColumn.current) {
      isSyncingFromAdvanced.current = true;
      const syncedColumnFilters = syncAdvancedToColumn(filters);
      
      setColumnFilters((prev) => {
        // If filters array is empty, clear all column filters
        // Otherwise, merge: new filters from AdvancedFilters replace old ones for same columns
        if (filters.length === 0) {
          return {};
        }
        return { ...prev, ...syncedColumnFilters };
      });
      // Reset flag after state update
      setTimeout(() => {
        isSyncingFromAdvanced.current = false;
      }, 0);
    }
  }, [syncAdvancedToColumn]);
  
  // Handler for column filters changes (from ColumnFilters component)
  const handleColumnFiltersChange = useCallback((filters: Record<string, ActiveFilter[]>) => {
    setColumnFilters(filters);

    // Sync to AdvancedFilters (most recent filter replaces previous one for same column)
    // Only sync if not already syncing from advanced filters to avoid infinite loop
    if (!isSyncingFromAdvanced.current) {
      isSyncingFromColumn.current = true;
      const syncedActiveFilters = syncColumnToAdvanced(filters);
      setActiveFilters(syncedActiveFilters);
      // Reset flag after state update
      setTimeout(() => {
        isSyncingFromColumn.current = false;
      }, 0);
    }
  }, [syncColumnToAdvanced]);
  
  // Handler for multiple sorts (from SortButton - onMultiSortChange)
  // This is the primary handler for all sort changes
  const handleMultiSortChange = useCallback((sorts: Array<{ columnName: string; direction: 'ASC' | 'DESC' }>) => {
    if (sorts.length > 0) {
      // Update server-side sort with all sorts
      setServerOrderBy(sorts);
    } else {
      // Reset to default sort if no sorts
      setServerOrderBy([{
        columnName: 'createdAt',
        direction: 'DESC',
      }]);
    }
  }, []);
  
  // Handler for server-side sort changes (from SortButton - single sort for backwards compatibility)
  // This is kept for backwards compatibility but should not be used when onMultiSortChange is available
  const handleSortChange = useCallback((sort: { columnName: string; direction: 'ASC' | 'DESC' } | undefined) => {
    // Convert single sort to array format and use handleMultiSortChange
    if (sort) {
      handleMultiSortChange([sort]);
    } else {
      handleMultiSortChange([]);
    }
  }, [handleMultiSortChange]);

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
    
    // Advanced filters
    activeFilters,
    handleAdvancedFiltersChange,
    
    // Column filters
    columnFilters,
    handleColumnFiltersChange,
    
    // Sorting
    serverOrderBy,
    handleSortChange,
    handleMultiSortChange,

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
