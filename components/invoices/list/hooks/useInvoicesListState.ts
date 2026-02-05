/**
 * useInvoicesListState Hook
 * Main state management hook for the invoices list
 * Integrates all sub-hooks and manages overall state
 * Uses real API data with infinite scroll and search
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Invoice, OrderSplitRate, InvoiceStatus } from '@/lib/types/rms';
import { mockSalesReps } from '@/lib/data/rms-mock';
import { useInvoicesInfinite, useInvoiceSearch, type InvoiceLandingPage, type InvoiceLandingPageFilter, type InvoiceLandingPageOrderBy, fetchAllInvoiceIds } from '../../api';
import { useInvoiceFilters } from './useInvoiceFilters';
import { useInvoiceBulkActions } from './useInvoiceBulkActions';
import { useBulkSelection } from '../../../shared';
import { isInvoiceLinked } from '../utils';
import type { QuickDatePreset, QuickDateField, SortField, SortDirection } from '../types';
import { getQuickDateRange } from '../utils';
import { formatDateToISO, formatDateToBackend } from '../../../advancedFilters/utils';
import type { ActiveFilter, FilterOperator } from '../../../advancedFilters/types';
import { useFilterSync } from '../../../advancedFilters/hooks/useFilterSync';
import { getInvoiceFilterOptions } from '../config/filterConfig';
import { useInvoiceSettings } from '@/contexts/UserSettingsContext';

/**
 * Map UI SortField to API columnName
 */
function mapSortFieldToColumnName(sortField: SortField): string {
  const fieldMap: Record<SortField, string> = {
    invoiceNumber: 'invoiceNumber',
    customerName: 'soldToCustomerName', // Not available yet
    manufacturerName: 'factoryName', // Not available yet
    invoiceDate: 'entityDate',
    entryDate: 'createdAt',
    dueDate: 'dueDate',
    total: 'total',
    balance: 'balance', // Not available yet
    status: 'status',
  };
  return fieldMap[sortField] || 'entityDate';
}

/**
 * Map API status to RMS InvoiceStatus type
 * RMS uses: 'open' | 'paid' | 'partial_paid' | 'void' | 'dormant'
 */
function mapApiStatusToInvoiceStatus(status?: string): InvoiceStatus {
  const s = status?.toLowerCase();
  switch (s) {
    case 'open':
      return 'open';
    case 'paid':
      return 'paid';
    case 'partial_paid':
    case 'partial':
      return 'partial_paid';
    case 'void':
      return 'void';
    case 'dormant':
      return 'dormant';
    default:
      return 'open';
  }
}

/**
 * Transform InvoiceLandingPage from API to UI Invoice type
 * Maps API fields to the existing UI structure
 */
function transformLandingPageToInvoice(landing: InvoiceLandingPage): Invoice {
  return {
    id: landing.id,
    invoiceNumber: landing.invoiceNumber || '',
    orderId: landing.orderId || '',
    orderNumber: landing.orderNumber || '',
    // Use factoryName from API if available
    customerId: '',
    customerName: '-',
    manufacturerId: '',
    manufacturerName: landing.factoryName || '-',
    status: mapApiStatusToInvoiceStatus(landing.status),
    isLocked: landing.locked || false,
    invoiceDate: landing.entityDate || '',
    entryDate: landing.createdAt || '',
    dueDate: landing.dueDate || '',
    createdAt: landing.createdAt || '',
    createdBy: typeof landing.createdBy === 'string' ? landing.createdBy : '',
    updatedAt: landing.createdAt || '',
    lineItems: [],
    subtotal: landing.total || 0,
    freight: 0,
    total: landing.total || 0,
    amountPaid: 0,
    amountCredited: 0,
    balance: landing.total || 0,
    totalCommission: landing.commission || 0,
    splitRates: [],
    // Pass through new fields directly
    factoryName: landing.factoryName,
    published: landing.published,
  } as Invoice;
}

export function useInvoicesListState() {
  // Get saved view settings
  const { settings: invoiceSettings, isInitialized: isSettingsInitialized } = useInvoiceSettings();
  const savedView = invoiceSettings?.savedView;
  const hasAppliedSavedView = useRef(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Quick date filter state - defined BEFORE API hook
  const [quickDatePreset, setQuickDatePreset] = useState<QuickDatePreset>('all');
  const [quickDateField, setQuickDateField] = useState<QuickDateField>('entryDate');
  const [showQuickDateFieldDropdown, setShowQuickDateFieldDropdown] = useState(false);

  // Server-side filters - defined BEFORE API hook so they can be passed to the query
  const [serverFilters, setServerFilters] = useState<InvoiceLandingPageFilter[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, ActiveFilter[]>>({});
  
  // Initialize columnFiltersToAPI as empty (will be computed after invoices are loaded)
  const [columnFiltersToAPIState, setColumnFiltersToAPIState] = useState<InvoiceLandingPageFilter[]>([]);
  
  // Refs to prevent infinite loops during synchronization
  const isSyncingFromAdvanced = useRef(false);
  const isSyncingFromColumn = useRef(false);

  // Sort state - defined BEFORE API hook
  // Note: sortField and sortDirection come from useInvoiceFilters, but we'll manage serverOrderBy here
  // Server-side sorting - defined BEFORE API hook
  // Initialize with default sort
  const [serverOrderBy, setServerOrderBy] = useState<InvoiceLandingPageOrderBy[]>(() => {
    return [{
      columnName: mapSortFieldToColumnName('invoiceDate'),
      direction: 'DESC',
    }];
  });

  // Map from UI column keys to filter option IDs (for sync)
  const columnKeyToFilterId: Record<string, string> = useMemo(() => ({
    invoiceNumber: 'invoice-number',
    status: 'status',
    total: 'total',
    commission: 'commission',
    invoiceDate: 'invoice-date',
    dueDate: 'due-date',
    entryDate: 'created-date',
    orderNumber: 'order-number',
    published: 'published',
    factoryName: 'factory-name',
  }), []);

  // We initialize with empty arrays to avoid dependency issues
  const invoiceFilterOptionsForSync = useMemo(() => {
    return getInvoiceFilterOptions();
  }, []);

  // Hook for synchronizing filters between AdvancedFilters and ColumnFilters
  const { syncAdvancedToColumn, syncColumnToAdvanced } = useFilterSync({
    filterOptions: invoiceFilterOptionsForSync,
    columnKeyToFilterId,
  });

  // Handler for server-side filter changes (from AdvancedFilters)
  const handleServerFiltersChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    
    // Convert ActiveFilter to InvoiceLandingPageFilter
    // Only include value OR values, not both - check which one exists
    const apiFilters: InvoiceLandingPageFilter[] = filters.map(f => {
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
      const apiFilters: InvoiceLandingPageFilter[] = syncedActiveFilters.map(f => {
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
      setServerFilters(apiFilters);
      // Reset flag after state update
      setTimeout(() => {
        isSyncingFromColumn.current = false;
      }, 0);
    }
  }, [syncColumnToAdvanced]);

  // Build quick filters based on quick date filter selection
  const quickFilters = useMemo<InvoiceLandingPageFilter[]>(() => {
    const result: InvoiceLandingPageFilter[] = [];

    if (quickDatePreset !== 'all') {
      const { start, end } = getQuickDateRange(quickDatePreset);
      if (start && end) {
        // Use quickDateField to determine which column to filter
        // Map UI field names to API field names:
        // - entryDate (UI) -> createdAt (API)
        // - invoiceDate (UI) -> entityDate (API)
        const columnName = quickDateField === 'entryDate' ? 'createdAt' : 'entityDate';
        
        // Format date based on column type:
        // - entityDate (Invoice Date): YYYY-MM-DD format (date only)
        // - createdAt: Backend format '%Y-%m-%d %H:%M:%S' (datetime with time)
        const formatDate = (date: Date): string => {
          if (columnName === 'entityDate') {
            return formatDateToISO(date); // Returns YYYY-MM-DD
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

  // Convert column filters (Record<string, ActiveFilter[]>) to InvoiceLandingPageFilter[]
  const columnFiltersToAPI = useMemo<InvoiceLandingPageFilter[]>(() => {
    const filters: InvoiceLandingPageFilter[] = [];
    
    // Flatten all column filters into a single array
    Object.values(columnFilters).forEach((columnFilterArray) => {
      // Ensure columnFilterArray is always an array
      if (!Array.isArray(columnFilterArray)) return;
      
      columnFilterArray.forEach((filter) => {
        // Convert ActiveFilter to InvoiceLandingPageFilter
        if (filter.values && filter.values.length > 0) {
          filters.push({
            operator: filter.operator,
            columnName: filter.columnName,
            values: filter.values,
          });
        } else if (filter.value) {
          filters.push({
            operator: filter.operator,
            columnName: filter.columnName,
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

  // Apply saved view when settings are loaded (only once on mount)
  useEffect(() => {
    if (isSettingsInitialized && savedView && !hasAppliedSavedView.current) {
      hasAppliedSavedView.current = true;

      // Apply saved filters
      if (savedView.filters && savedView.filters.length > 0) {
        const restoredFilters: ActiveFilter[] = savedView.filters.map((f) => ({
          operator: f.operator as FilterOperator,
          columnName: f.columnName,
          value: f.value,
          values: f.values,
        }));
        setActiveFilters(restoredFilters);
        const apiFilters: InvoiceLandingPageFilter[] = restoredFilters.map(f => {
          if (f.values && f.values.length > 0) {
            return { operator: f.operator, columnName: f.columnName, values: f.values };
          }
          return { operator: f.operator, columnName: f.columnName, value: f.value };
        });
        setServerFilters(apiFilters);
      }

      // Apply saved column filters
      if (savedView.columnFilters && Object.keys(savedView.columnFilters).length > 0) {
        const restoredColumnFilters: Record<string, ActiveFilter[]> = {};
        Object.entries(savedView.columnFilters).forEach(([key, filters]) => {
          restoredColumnFilters[key] = filters.map((f) => ({
            operator: f.operator as FilterOperator,
            columnName: f.columnName,
            value: f.value,
            values: f.values,
          }));
        });
        setColumnFilters(restoredColumnFilters);
      }

      // Apply saved sort
      if (savedView.sortField) {
        const fieldMap: Record<string, SortField> = {
          invoiceNumber: 'invoiceNumber',
          status: 'status',
          entityDate: 'invoiceDate',
          dueDate: 'dueDate',
          total: 'total',
          balance: 'balance',
        };
        const mappedField = fieldMap[savedView.sortField] || (savedView.sortField as SortField);
        setServerOrderBy([{
          columnName: mapSortFieldToColumnName(mappedField),
          direction: (savedView.sortDirection?.toUpperCase() || 'DESC') as 'ASC' | 'DESC',
        }]);
      }

      // Apply saved quick date preset
      if (savedView.quickDatePreset) {
        setQuickDatePreset(savedView.quickDatePreset as QuickDatePreset);
      }

      // Apply saved quick date field
      if (savedView.quickDateField) {
        setQuickDateField(savedView.quickDateField as QuickDateField);
      }
    }
  }, [isSettingsInitialized, savedView]);

  // Combine quick filters with server filters (serverFilters already contains synced column filters)
  const filters = useMemo<InvoiceLandingPageFilter[]>(() => {
    return [...quickFilters, ...serverFilters];
  }, [quickFilters, serverFilters]);

  // Build orderBy from sort state
  const orderBy = useMemo<InvoiceLandingPageOrderBy[]>(() => {
    return serverOrderBy;
  }, [serverOrderBy]);

  // Fetch invoices from API with infinite scroll
  const {
    data: invoicesData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInvoicesInfinite(filters, orderBy);

  // Search invoices
  const { data: searchResults, isLoading: isSearching } = useInvoiceSearch(searchQuery, searchQuery.length >= 2);

  // Flatten paginated data with deduplication
  const allInvoicesData = useMemo(() => {
    if (!invoicesData?.pages) return [];
    const allRecords = invoicesData.pages.flatMap(page => page.records);
    // Deduplicate by ID to prevent duplicate keys in React
    const seen = new Set<string>();
    return allRecords.filter(record => {
      if (seen.has(record.id)) return false;
      seen.add(record.id);
      return true;
    });
  }, [invoicesData]);

  // Get total count
  const totalCount = useMemo(() => {
    if (!invoicesData?.pages || invoicesData.pages.length === 0) return 0;
    return invoicesData.pages[0].total;
  }, [invoicesData]);

  // Transform API data to UI format, using search results when searching
  const invoices: Invoice[] = useMemo(() => {
    // If searching and we have results, transform search results
    if (searchQuery.length >= 2 && searchResults) {
      // Deduplicate search results as well
      const seen = new Set<string>();
      const uniqueSearchResults = searchResults.filter((result: any) => {
        if (seen.has(result.id)) return false;
        seen.add(result.id);
        return true;
      });
      
      return uniqueSearchResults.map((result: any): Invoice => ({
        id: result.id,
        invoiceNumber: result.invoiceNumber || '',
        orderId: result.orderId || '',
        orderNumber: '',
        customerId: '',
        customerName: '',
        manufacturerId: '',
        manufacturerName: '',
        status: mapApiStatusToInvoiceStatus(result.status),
        isLocked: result.locked || false,
        invoiceDate: result.entityDate || '',
        entryDate: result.createdAt || '',
        dueDate: result.dueDate || '',
        createdAt: result.createdAt || '',
        createdBy: '',
        updatedAt: result.createdAt || '',
        lineItems: [],
        subtotal: 0,
        freight: 0,
        total: 0,
        amountPaid: 0,
        amountCredited: 0,
        balance: 0,
        totalCommission: 0,
        splitRates: [],
        published: result.published,
      } as Invoice));
    }

    if (!allInvoicesData.length) return [];
    return allInvoicesData.map(transformLandingPageToInvoice);
  }, [allInvoicesData, searchQuery, searchResults]);

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

  // Local invoices state for optimistic updates (bulk actions, etc.)
  const [localInvoices, setLocalInvoices] = useState<Invoice[]>([]);

  // Setter that updates local invoices
  const setInvoices = (updater: Invoice[] | ((prev: Invoice[]) => Invoice[])) => {
    if (typeof updater === 'function') {
      setLocalInvoices(prev => updater(prev.length > 0 ? prev : invoices));
    } else {
      setLocalInvoices(updater);
    }
  };

  // Selected invoice for detail panel
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Create invoice modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Record payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Commission splits editing state
  const [editingSplits, setEditingSplits] = useState(false);
  const [editedSplits, setEditedSplits] = useState<OrderSplitRate[]>([]);

  // Integrate filter hook (for client-side filtering and other filter state)
  // Note: quickDatePreset, quickDateField are now managed at this level for server-side
  // Also exclude columnFilters and setColumnFilters - we manage those at this level for server-side sync
  const filterState = useInvoiceFilters(invoices);
  
  // Extract filter state, excluding quick date filters and column filters (we manage those at this level)
  const {
    quickDatePreset: _quickDatePreset,
    setQuickDatePreset: _setQuickDatePreset,
    quickDateField: _quickDateField,
    setQuickDateField: _setQuickDateField,
    showQuickDateFieldDropdown: _showQuickDateFieldDropdown,
    setShowQuickDateFieldDropdown: _setShowQuickDateFieldDropdown,
    columnFilters: _oldColumnFilters,
    setColumnFilters: _oldSetColumnFilters,
    sortField: _sortField,
    sortDirection: _sortDirection,
    handleSort: _handleSort,
    setSortField: _setSortField,
    setSortDirection: _setSortDirection,
    clearAllFilters: _oldClearAllFilters,
    ...otherFilterState
  } = filterState;

  // Use sortField and sortDirection from filterState, but we'll manage serverOrderBy separately
  const sortField = _sortField;
  const sortDirection = _sortDirection;

  // Handler for server-side sort changes (from SortButton - ActiveSort format)
  const handleSortChange = useCallback((sort: { columnName: string; direction: 'ASC' | 'DESC' } | undefined) => {
    if (sort) {
      // Update server-side sort
      setServerOrderBy([{
        columnName: sort.columnName,
        direction: sort.direction,
      }]);
      
      // Also update local sort state for backwards compatibility
      // Map API columnName back to SortField if possible
      const fieldMap: Record<string, SortField> = {
        'invoiceNumber': 'invoiceNumber',
        'status': 'status',
        'entityDate': 'invoiceDate',
        'createdAt': 'entryDate',
        'dueDate': 'dueDate',
        'total': 'total',
        'commission': 'total', // Note: commission maps to total in UI (no commission in SortField)
        'orderNumber': 'invoiceNumber', // Note: orderNumber not in SortField, use invoiceNumber as fallback
        'published': 'status', // Note: published not in SortField, use status as fallback
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
        columnName: mapSortFieldToColumnName('invoiceDate'),
        direction: 'DESC',
      }]);
      if (_setSortField && _setSortDirection) {
        _setSortField('invoiceDate');
        _setSortDirection('desc');
      }
    }
  }, [_setSortField, _setSortDirection]);

  // Integrate shared bulk selection hook
  // Note: Not using isItemEligible - individual row checkboxes handle disabled state
  const bulkSelection = useBulkSelection({
    items: invoices,
    totalCount,
    fetchAllIds: fetchAllInvoiceIds,
  });

  // Bulk delete modal state
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Handle successful bulk delete
  const handleBulkDeleteSuccess = useCallback(() => {
    bulkSelection.clearSelection();
    setShowBulkDeleteModal(false);
    refetch();
  }, [bulkSelection, refetch]);

  // Compatibility layer for existing selection API
  const selectedInvoiceIds = bulkSelection.selectedIds;
  const toggleInvoiceSelection = useCallback((invoiceId: string) => {
    bulkSelection.handleSelectOne(invoiceId, !bulkSelection.isItemSelected(invoiceId));
  }, [bulkSelection]);
  const selectAllInvoices = useCallback(() => {
    bulkSelection.handleSelectAll(true);
  }, [bulkSelection]);
  const clearSelection = bulkSelection.clearSelection;
  const areAllEligibleSelected = bulkSelection.isAllSelected;

  // Integrate bulk actions hook
  const bulkActionsState = useInvoiceBulkActions({
    selectedInvoiceIds: bulkSelection.selectedIds,
    clearSelection: bulkSelection.clearSelection,
    setInvoices,
  });

  // Commission split editing functions
  const startEditingSplits = () => {
    if (selectedInvoice) {
      setEditedSplits([...selectedInvoice.splitRates]);
      setEditingSplits(true);
    }
  };

  const cancelEditingSplits = () => {
    setEditingSplits(false);
    setEditedSplits([]);
  };

  const updateSplitPercentage = (index: number, newPercentage: number) => {
    const updated = [...editedSplits];
    updated[index] = { ...updated[index], splitPercentage: newPercentage };
    // Recalculate commission amount based on new percentage
    if (selectedInvoice) {
      updated[index].commissionAmount =
        (selectedInvoice.totalCommission * newPercentage) / 100;
    }
    setEditedSplits(updated);
  };

  const addNewSplit = () => {
    const newSplit: OrderSplitRate = {
      salesRepId: '',
      salesRepName: '',
      splitPercentage: 0,
      commissionAmount: 0,
    };
    setEditedSplits([...editedSplits, newSplit]);
  };

  const removeSplit = (index: number) => {
    setEditedSplits(editedSplits.filter((_, i) => i !== index));
  };

  const updateSplitRep = (index: number, repId: string) => {
    const rep = mockSalesReps.find((r) => r.id === repId);
    if (rep) {
      const updated = [...editedSplits];
      updated[index] = {
        ...updated[index],
        salesRepId: repId,
        salesRepName: rep.name,
      };
      setEditedSplits(updated);
    }
  };

  const saveSplits = () => {
    if (selectedInvoice) {
      const totalPercentage = editedSplits.reduce(
        (sum, s) => sum + s.splitPercentage,
        0
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert('Split percentages must total 100%');
        return;
      }

      const updatedInvoice = {
        ...selectedInvoice,
        splitRates: editedSplits,
      };
      setInvoices(
        invoices.map((i) => (i.id === selectedInvoice.id ? updatedInvoice : i))
      );
      setSelectedInvoice(updatedInvoice);
      setEditingSplits(false);
      setEditedSplits([]);
    }
  };

  const splitPercentageTotal = editedSplits.reduce(
    (sum, s) => sum + s.splitPercentage,
    0
  );

  // Clear all filters (advanced, column, quick date, and search)
  const clearAllFilters = useCallback(() => {
    setActiveFilters([]);
    setServerFilters([]);
    setColumnFilters({});
    setQuickDatePreset('all');
    setSearchQuery('');
  }, []);

  // Handle create invoice
  const handleCreateInvoice = (newInvoice: Invoice) => {
    setInvoices([newInvoice, ...invoices]);
    setShowCreateModal(false);
    // Refetch to get fresh data from API
    refetch();
  };

  return {
    // Invoices data
    invoices,
    allInvoicesData, // Raw InvoiceLandingPage[] data for export
    setInvoices,
    // Loading and error state
    isLoading,
    isSearching,
    error,
    refetch,
    // Pagination
    totalCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    handleScroll,
    // Search
    searchQuery,
    setSearchQuery,
    // Selected invoice
    selectedInvoice,
    setSelectedInvoice,
    // Create modal
    showCreateModal,
    setShowCreateModal,
    handleCreateInvoice,
    // Payment modal
    showPaymentModal,
    setShowPaymentModal,
    // Commission splits editing
    editingSplits,
    setEditingSplits,
    editedSplits,
    setEditedSplits,
    startEditingSplits,
    cancelEditingSplits,
    updateSplitPercentage,
    addNewSplit,
    removeSplit,
    updateSplitRep,
    saveSplits,
    splitPercentageTotal,
    // Quick date filters (managed at this level for server-side)
    quickDatePreset,
    setQuickDatePreset,
    quickDateField,
    setQuickDateField,
    showQuickDateFieldDropdown,
    setShowQuickDateFieldDropdown,
    // Advanced filters
    activeFilters,
    handleServerFiltersChange,
    serverFilters,
    clearAllFilters,
    // Column filters
    columnFilters,
    handleColumnFiltersChange,
    invoiceFilterOptionsWithValues: invoiceFilterOptionsForSync,
    // Sorting
    sortField,
    sortDirection,
    handleSortChange,
    // Filter state and actions (excluding quick date filters and sort state managed above)
    ...otherFilterState,
    // Selection state and actions (using shared bulk selection)
    selectedInvoiceIds,
    toggleInvoiceSelection,
    selectAllInvoices,
    clearSelection,
    areAllEligibleSelected,
    // New bulk selection values for proper "select all" functionality
    isItemSelected: bulkSelection.isItemSelected,
    isAllSelected: bulkSelection.isAllSelected,
    isPartiallySelected: bulkSelection.isPartiallySelected,
    handleSelectAll: bulkSelection.handleSelectAll,
    handleSelectOne: bulkSelection.handleSelectOne,
    selectAllMode: bulkSelection.selectAllMode,
    selectedCount: bulkSelection.selectedCount,
    getAllSelectedIds: bulkSelection.getAllSelectedIds,
    // Bulk delete modal
    showBulkDeleteModal,
    setShowBulkDeleteModal,
    handleBulkDeleteSuccess,
    // Bulk actions state and actions
    ...bulkActionsState,
  };
}
