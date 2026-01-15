/**
 * useCommissionsListState Hook
 * Main state management hook for the commissions list
 * Integrates all sub-hooks and manages overall state
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { CommissionCheck } from '@/lib/types/rms';
import {
  type Check,
  type CheckLandingPage,
  type CreateCheckInput,
  type UpdateCheckInput,
  type CheckStatus,
  type CheckLandingPageOrderBy,
  type CheckLandingPageFilter,
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
import type { QuickDatePreset, QuickDateField, SortField, SortDirection } from '../types';
import { getQuickDateRange } from '../utils';
import { formatDateToISO, formatDateToBackend } from '../../../advancedFilters/utils';
import type { ActiveFilter } from '../../../advancedFilters/types';
import { useFilterSync } from '../../../advancedFilters/hooks/useFilterSync';
import { getCommissionFilterOptions } from '../config/filterConfig';

export function useCommissionsListState() {
  // Quick date filter state - defined BEFORE API hook
  const [quickDatePreset, setQuickDatePreset] = useState<QuickDatePreset>('all');
  const [quickDateField, setQuickDateField] = useState<QuickDateField>('entryDate');
  const [showQuickDateFieldDropdown, setShowQuickDateFieldDropdown] = useState(false);

  // Server-side filters - defined BEFORE API hook so they can be passed to the query
  const [serverFilters, setServerFilters] = useState<CheckLandingPageFilter[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, ActiveFilter[]>>({});
  
  // Initialize columnFiltersToAPI as empty (will be computed)
  const [columnFiltersToAPIState, setColumnFiltersToAPIState] = useState<CheckLandingPageFilter[]>([]);
  
  // Refs to prevent infinite loops during synchronization
  const isSyncingFromAdvanced = useRef(false);
  const isSyncingFromColumn = useRef(false);
  // Ref to prevent handleSortChange from overwriting handleMultiSortChange
  const isHandlingMultiSort = useRef(false);

  // Sort state - defined BEFORE API hook
  // Server-side sorting - initialize with default sort
  const [serverOrderBy, setServerOrderBy] = useState<CheckLandingPageOrderBy[]>(() => {
    return [{
      columnName: 'createdAt', // entryDate maps to createdAt
      direction: 'DESC',
    }];
  });

  /**
   * Map UI SortField to API columnName
   */
  function mapSortFieldToColumnName(sortField: SortField): string {
    const fieldMap: Record<SortField, string> = {
      checkNumber: 'checkNumber',
      status: 'status',
      netAmount: 'enteredCommissionAmount',
      commissionMonth: 'commissionMonth',
      manufacturerName: 'factoryName', // Note: may not be available yet
      postDate: 'postDate',
      checkDate: 'checkDate',
      entryDate: 'createdAt',
      checkBalance: 'enteredCommissionAmount', // Note: balance may not be available, use commission as fallback
    };
    return fieldMap[sortField] || 'createdAt';
  }

  // Map from UI column keys to filter option IDs (for sync)
  const columnKeyToFilterId: Record<string, string> = useMemo(() => ({
    checkNumber: 'check-number',
    status: 'status',
    commissionMonth: 'commission-month',
    postDate: 'post-date',
    checkDate: 'check-date',
    entryDate: 'entry-date',
    netAmount: 'net-amount',
    manufacturerName: 'factory-name',
  }), []);

  // We initialize with empty arrays to avoid dependency issues
  const commissionFilterOptionsForSync = useMemo(() => {
    return getCommissionFilterOptions();
  }, []);

  // Hook for synchronizing filters between AdvancedFilters and ColumnFilters
  const { syncAdvancedToColumn, syncColumnToAdvanced } = useFilterSync({
    filterOptions: commissionFilterOptionsForSync,
    columnKeyToFilterId,
  });

  // Build quick filters based on quick date filter selection
  const quickFilters = useMemo<CheckLandingPageFilter[]>(() => {
    const result: CheckLandingPageFilter[] = [];

    if (quickDatePreset !== 'all') {
      const { start, end } = getQuickDateRange(quickDatePreset);
      if (start && end) {
        // Use quickDateField to determine which column to filter
        // Map UI field names to API field names:
        // - entryDate (UI) -> createdAt (API)
        // - commissionMonth (UI) -> commissionMonth (API) - format as YYYY-MM
        const columnName = quickDateField === 'entryDate' ? 'createdAt' : 'commissionMonth';
        
        // Format date based on column type:
        // - commissionMonth: YYYY-MM format (e.g., "2025-01")
        // - createdAt: Backend format '%Y-%m-%d %H:%M:%S' (datetime with time)
        const formatDate = (date: Date): string => {
          if (columnName === 'commissionMonth') {
            // Format as YYYY-MM for commissionMonth
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            return `${year}-${month}`;
          }
          return formatDateToBackend(date); // Returns 'YYYY-MM-DD HH:MM:SS'
        };
        
        result.push({
          columnName,
          operator: 'GTE',
          value: formatDate(start),
        });

        result.push({
          columnName,
          operator: 'LTE',
          value: formatDate(end),
        });
      }
    }

    return result;
  }, [quickDatePreset, quickDateField]);

  // Convert column filters (Record<string, ActiveFilter[]>) to API filter format
  const columnFiltersToAPI = useMemo<CheckLandingPageFilter[]>(() => {
    const filters: CheckLandingPageFilter[] = [];
    
    // Flatten all column filters into a single array
    Object.values(columnFilters).forEach((columnFilterArray) => {
      // Ensure columnFilterArray is always an array
      if (!Array.isArray(columnFilterArray)) return;
      
      columnFilterArray.forEach((filter) => {
        // Convert ActiveFilter to API filter format
        if (filter.values && filter.values.length > 0) {
          // For multi-value filters (IN operator), use values array
          filters.push({
            columnName: filter.columnName,
            operator: filter.operator,
            values: filter.values,
          });
        } else if (filter.value) {
          filters.push({
            columnName: filter.columnName,
            operator: filter.operator,
            value: filter.value,
          });
        }
      });
    });
    
    return filters;
  }, [columnFilters]);

  // Update state when columnFiltersToAPI changes
  useEffect(() => {
    setColumnFiltersToAPIState(columnFiltersToAPI);
  }, [columnFiltersToAPI]);

  // Combine quick filters with server filters and column filters
  const filters = useMemo(() => {
    return [...quickFilters, ...serverFilters, ...columnFiltersToAPIState];
  }, [quickFilters, serverFilters, columnFiltersToAPIState]);

  // Build orderBy from sort state
  const orderBy = useMemo<CheckLandingPageOrderBy[]>(() => {
    return serverOrderBy;
  }, [serverOrderBy]);

  // Fetch checks from real API with infinite scroll - now with combined filters and orderBy
  const DEFAULT_PAGE_SIZE = 50;
  const {
    data: checksData,
    isLoading: isLoadingChecks,
    error: checksError,
    refetch: refetchChecks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChecksInfinite(filters, DEFAULT_PAGE_SIZE, orderBy);

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

  // Handler for server-side filter changes (from AdvancedFilters)
  const handleServerFiltersChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    
    // Convert ActiveFilter to API filter format
    // Only include value OR values, not both - check which one exists
    const apiFilters: CheckLandingPageFilter[] = filters.map(f => {
      if (f.values && f.values.length > 0) {
        // For multi-value filters (IN operator), use values array
        return {
          columnName: f.columnName,
          operator: f.operator,
          values: f.values,
        };
      }
      return {
        columnName: f.columnName,
        operator: f.operator,
        value: f.value || '',
      };
    });
    setServerFilters(apiFilters);

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

  // Handler for column filter changes (from ColumnFilters)
  const handleColumnFiltersChange = useCallback((filters: Record<string, ActiveFilter[]>) => {
    setColumnFilters(filters);

    // Sync to AdvancedFilters (most recent filter replaces previous one for same column)
    // Only sync if not already syncing from advanced filters to avoid infinite loop
    if (!isSyncingFromAdvanced.current) {
      isSyncingFromColumn.current = true;
      const syncedActiveFilters = syncColumnToAdvanced(filters);
      setActiveFilters(syncedActiveFilters);
      
      // Also update serverFilters to trigger API call
      const apiFilters: CheckLandingPageFilter[] = syncedActiveFilters.map(f => {
        if (f.values && f.values.length > 0) {
          // For multi-value filters (IN operator), use values array
          return {
            columnName: f.columnName,
            operator: f.operator,
            values: f.values,
          };
        }
        return {
          columnName: f.columnName,
          operator: f.operator,
          value: f.value || '',
        };
      });
      setServerFilters(apiFilters);
      // Reset flag after state update
      setTimeout(() => {
        isSyncingFromColumn.current = false;
      }, 0);
    }
  }, [syncColumnToAdvanced]);

  // Integrate filter hook (but exclude quick filters since they're now server-side)
  const filterState = useCommissionFilters(checks);
  
  // Extract quick filter state from filterState but override with our server-side state
  // We keep the setters from filterState for compatibility
  const {
    quickDatePreset: _quickDatePreset,
    setQuickDatePreset: _setQuickDatePreset,
    quickDateField: _quickDateField,
    setQuickDateField: _setQuickDateField,
    showQuickDateFieldDropdown: _showQuickDateFieldDropdown,
    setShowQuickDateFieldDropdown: _setShowQuickDateFieldDropdown,
    sortField: _sortField,
    sortDirection: _sortDirection,
    handleSort: _handleSort,
    setSortField: _setSortField,
    setSortDirection: _setSortDirection,
    ...otherFilterState
  } = filterState;

  // Use sortField and sortDirection from filterState, but we'll manage serverOrderBy separately
  const sortField = _sortField;
  const sortDirection = _sortDirection;

  // Handler for server-side sort changes (from SortButton - ActiveSort format)
  // Note: This is called for backwards compatibility when only one sort is active.
  // When multiple sorts are active, handleMultiSortChange is used instead.
  const handleSortChange = useCallback((sort: { columnName: string; direction: 'ASC' | 'DESC' } | undefined) => {
    // If handleMultiSortChange was just called, ignore this call to avoid overwriting
    if (isHandlingMultiSort.current) {
      // Reset flag after a brief delay to allow handleMultiSortChange to complete
      setTimeout(() => {
        isHandlingMultiSort.current = false;
      }, 0);
      return;
    }
    
    // Only update serverOrderBy if we have exactly one sort or clearing
    // Otherwise, handleMultiSortChange will handle it
    if (sort) {
      // Update server-side sort with single element
      setServerOrderBy([{
        columnName: sort.columnName,
        direction: sort.direction,
      }]);
      
      // Also update local sort state for backwards compatibility
      // Map API columnName back to SortField if possible
      const fieldMap: Record<string, SortField> = {
        'checkNumber': 'checkNumber',
        'status': 'status',
        'enteredCommissionAmount': 'netAmount',
        'commissionMonth': 'commissionMonth',
        'factoryName': 'manufacturerName',
        'postDate': 'postDate',
        'checkDate': 'checkDate',
        'createdAt': 'entryDate',
      };
      
      const mappedField = fieldMap[sort.columnName];
      if (mappedField && _setSortField && _setSortDirection) {
        // Update sort field and direction directly
        _setSortField(mappedField);
        _setSortDirection(sort.direction.toLowerCase() as SortDirection);
      }
    } else {
      // Clear sort - reset to default
      setServerOrderBy([{
        columnName: mapSortFieldToColumnName('entryDate'),
        direction: 'DESC',
      }]);
      if (_setSortField && _setSortDirection) {
        _setSortField('entryDate');
        _setSortDirection('desc');
      }
    }
  }, [_setSortField, _setSortDirection]);

  // Handler for multiple server-side sorts (from SortButton - ActiveSort[] format)
  const handleMultiSortChange = useCallback((sorts: { columnName: string; direction: 'ASC' | 'DESC' }[]) => {
    // Set flag to prevent handleSortChange from overwriting
    isHandlingMultiSort.current = true;
    
    // Update server-side sorts with all provided sorts
    const orderBy: CheckLandingPageOrderBy[] = sorts.map(sort => ({
      columnName: sort.columnName,
      direction: sort.direction,
    }));
    setServerOrderBy(orderBy);
    
    // Also update local sort state for backwards compatibility (use first sort)
    if (sorts.length > 0) {
      const firstSort = sorts[0];
      const fieldMap: Record<string, SortField> = {
        'checkNumber': 'checkNumber',
        'status': 'status',
        'enteredCommissionAmount': 'netAmount',
        'commissionMonth': 'commissionMonth',
        'factoryName': 'manufacturerName',
        'postDate': 'postDate',
        'checkDate': 'checkDate',
        'createdAt': 'entryDate',
      };
      
      const mappedField = fieldMap[firstSort.columnName];
      if (mappedField && _setSortField && _setSortDirection) {
        _setSortField(mappedField);
        _setSortDirection(firstSort.direction.toLowerCase() as SortDirection);
      }
    } else {
      // Clear sort - reset to default
      setServerOrderBy([{
        columnName: mapSortFieldToColumnName('entryDate'),
        direction: 'DESC',
      }]);
      if (_setSortField && _setSortDirection) {
        _setSortField('entryDate');
        _setSortDirection('desc');
      }
    }
    
    // Reset flag after state update
    setTimeout(() => {
      isHandlingMultiSort.current = false;
    }, 0);
  }, [_setSortField, _setSortDirection]);

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
    ...otherFilterState,
    // Quick date filter state (server-side)
    quickDatePreset,
    setQuickDatePreset,
    quickDateField,
    setQuickDateField,
    showQuickDateFieldDropdown,
    setShowQuickDateFieldDropdown,
    // AdvancedFilters state
    activeFilters,
    handleServerFiltersChange,
    // Column filters state
    columnFilters,
    handleColumnFiltersChange,
    // Sort state
    sortField,
    sortDirection,
    handleSortChange,
    handleMultiSortChange,
    serverOrderBy,

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
