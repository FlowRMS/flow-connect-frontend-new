/**
 * useOrdersListState Hook
 * Main state management hook for the orders list
 * Integrates all sub-hooks and manages overall state
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Order, OrderSplitRate } from '@/lib/types/rms';
import { mockSalesReps } from '@/lib/data/rms-mock';
import { useOrdersInfinite, useOrderSearch, type OrderLandingPage, type OrderSearchResult, type OrderLandingPageFilter, type OrderLandingPageOrderBy } from '../../api';
import { useOrderFilters } from './useOrderFilters';
import { useOrderSelection } from './useOrderSelection';
import { useOrderBulkActions } from './useOrderBulkActions';
import type { ActiveFilter } from '../../../advancedFilters/AdvancedFilters';
import type { QuickDatePreset, QuickDateField, SortField, SortDirection } from '../types';
import { getQuickDateRange } from '../utils';
import { formatDateToISO, formatDateToBackend } from '../../../advancedFilters/utils';
import { useFilterSync } from '../../../advancedFilters/hooks/useFilterSync';
import { getOrderFilterOptions } from '../config/filterConfig';
import { useOrderSettings } from '@/contexts/UserSettingsContext';
import type { FilterOperator } from '../../../advancedFilters/types';

/**
 * Transform OrderLandingPage from API to UI Order type
 * Maps API fields to the existing UI structure
 */
function transformLandingPageToOrder(landing: OrderLandingPage): Order {
  return {
    id: landing.id,
    orderNumber: landing.orderNumber,
    // Use new API fields: factoryName, soldToCustomerName, jobName
    manufacturerId: '',
    manufacturerName: landing.factoryName || '-',
    customerId: '',
    customerName: landing.soldToCustomerName || '-',
    jobName: landing.jobName || '',
    orderType: landing.orderType,
    status: mapApiStatusToOrderStatus(landing.status),
    fulfillmentStatus: 'not_started',
    billingStatus: 'not_invoiced',
    commissionStatus: 'pending',
    orderDate: landing.entityDate || '',
    createdAt: landing.createdAt || '',
    createdBy: typeof landing.createdBy === 'string' ? landing.createdBy : '',
    updatedAt: landing.createdAt || '',
    lineItems: [],
    subtotal: landing.total || 0,
    freight: 0,
    total: landing.total || 0,
    totalCommission: landing.commission || 0,
    splitRates: [],
    dueDate: landing.dueDate,
    // Pass through new fields directly
    factoryName: landing.factoryName,
    soldToCustomerName: landing.soldToCustomerName,
  } as Order;
}

/**
 * Map API status to OrderStatus type
 * Valid statuses: OPEN, PARTIAL_SHIPPED, SHIPPED_COMPLETE, CANCELLED, OVER_SHIPPED, PARTIAL_CANCELLED, OVER_CANCELLED
 */
function mapApiStatusToOrderStatus(status?: string): 'OPEN' | 'PARTIAL_SHIPPED' | 'SHIPPED_COMPLETE' | 'CANCELLED' | 'OVER_SHIPPED' | 'PARTIAL_CANCELLED' | 'OVER_CANCELLED' {
  const s = status?.toUpperCase();
  switch (s) {
    case 'OPEN':
      return 'OPEN';
    case 'PARTIAL_SHIPPED':
      return 'PARTIAL_SHIPPED';
    case 'SHIPPED_COMPLETE':
      return 'SHIPPED_COMPLETE';
    case 'CANCELLED':
      return 'CANCELLED';
    case 'OVER_SHIPPED':
      return 'OVER_SHIPPED';
    case 'PARTIAL_CANCELLED':
      return 'PARTIAL_CANCELLED';
    case 'OVER_CANCELLED':
      return 'OVER_CANCELLED';
    default:
      return 'OPEN';
  }
}

/**
 * Map SortField (UI) to columnName (API)
 */
function mapSortFieldToColumnName(sortField: SortField): string {
  const fieldMap: Record<SortField, string> = {
    orderNumber: 'orderNumber',
    customerName: 'soldToCustomerName',
    manufacturerName: 'factoryName',
    orderDate: 'entityDate',
    total: 'total',
    totalCommission: 'commission',
    status: 'status',
  };
  return fieldMap[sortField];
}

/**
 * Transform OrderSearchResult to UI Order type
 */
function transformSearchResultToOrder(result: OrderSearchResult): Order {
  return {
    id: result.id,
    orderNumber: result.orderNumber,
    manufacturerId: result.factoryId || '',
    manufacturerName: '',
    customerId: result.soldToCustomerId || '',
    customerName: '',
    status: mapApiStatusToOrderStatus(result.status),
    fulfillmentStatus: 'not_started',
    billingStatus: 'not_invoiced',
    commissionStatus: 'pending',
    orderDate: result.entityDate || '',
    createdAt: result.createdAt || '',
    createdBy: '',
    updatedAt: result.createdAt || '',
    lineItems: [],
    subtotal: 0,
    freight: 0,
    total: 0,
    totalCommission: 0,
    splitRates: [],
    dueDate: result.dueDate,
  };
}

export function useOrdersListState() {
  // Get saved view settings
  const { settings: orderSettings, isInitialized: isSettingsInitialized } = useOrderSettings();
  const savedView = orderSettings?.savedView;
  const hasAppliedSavedView = useRef(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Quick date filter state - defined BEFORE API hook
  const [quickDatePreset, setQuickDatePreset] = useState<QuickDatePreset>('all');
  const [quickDateField, setQuickDateField] = useState<QuickDateField>('createdAt');
  const [showQuickDateFieldDropdown, setShowQuickDateFieldDropdown] = useState(false);

  // Server-side filters - defined BEFORE API hook so they can be passed to the query
  const [serverFilters, setServerFilters] = useState<OrderLandingPageFilter[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, ActiveFilter[]>>({});
  
  // Initialize columnFiltersToAPI as empty (will be computed after orders are loaded)
  const [columnFiltersToAPIState, setColumnFiltersToAPIState] = useState<OrderLandingPageFilter[]>([]);
  
  // Refs to prevent infinite loops during synchronization
  const isSyncingFromAdvanced = useRef(false);
  const isSyncingFromColumn = useRef(false);
  
  // Sort state - defined BEFORE API hook
  const [sortField, setSortField] = useState<SortField>('orderDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Server-side sorting - defined BEFORE API hook
  // Initialize with default sort
  const [serverOrderBy, setServerOrderBy] = useState<OrderLandingPageOrderBy[]>(() => {
    return [{
      columnName: mapSortFieldToColumnName('orderDate'),
      direction: 'DESC',
    }];
  });
  
  // Map from UI column keys to filter option IDs (for sync)
  const columnKeyToFilterId: Record<string, string> = useMemo(() => ({
    orderNumber: 'order-number',
    status: 'status',
    total: 'total',
    commission: 'commission',
    orderDate: 'order-date',
    entryDate: 'created-date',
    jobName: 'job-name',
    published: 'published',
    factoryName: 'factory-name',
    customerName: 'customer-name',
    createdBy: 'created-by',
  }), []);

  // We initialize with empty arrays to avoid dependency issues
  const orderFilterOptionsForSync = useMemo(() => {
    return getOrderFilterOptions([], []);
  }, []);

  // Hook for synchronizing filters between AdvancedFilters and ColumnFilters
  const { syncAdvancedToColumn, syncColumnToAdvanced } = useFilterSync({
    filterOptions: orderFilterOptionsForSync,
    columnKeyToFilterId,
  });

  // Handler for server-side filter changes (from AdvancedFilters)
  const handleServerFiltersChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    
    // Convert ActiveFilter to OrderLandingPageFilter
    // Only include value OR values, not both - check which one exists
    const apiFilters: OrderLandingPageFilter[] = filters.map(f => {
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
      const apiFilters: OrderLandingPageFilter[] = syncedActiveFilters.map(f => {
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

  // Handler for multiple sorts (from SortButton - ActiveSort[] format)
  const handleMultiSortChange = useCallback((sorts: { columnName: string; direction: 'ASC' | 'DESC' }[]) => {
    if (sorts.length > 0) {
      // Update server-side sort with all sorts
      setServerOrderBy(sorts.map(sort => ({
        columnName: sort.columnName,
        direction: sort.direction,
      })));
      
      // Also update local sort state for backwards compatibility (use first sort)
      const fieldMap: Record<string, SortField> = {
        'orderNumber': 'orderNumber',
        'soldToCustomerName': 'customerName',
        'factoryName': 'manufacturerName',
        'entityDate': 'orderDate',
        'total': 'total',
        'commission': 'totalCommission',
        'status': 'status',
      };
      
      const firstSort = sorts[0];
      const mappedField = fieldMap[firstSort.columnName];
      if (mappedField) {
        setSortField(mappedField);
        setSortDirection(firstSort.direction.toLowerCase() as SortDirection);
      }
    } else {
      // Clear sort - use default
      setServerOrderBy([{
        columnName: mapSortFieldToColumnName('orderDate'),
        direction: 'DESC',
      }]);
      setSortField('orderDate');
      setSortDirection('desc');
    }
  }, []);

  // Build quick filters based on quick date filter selection
  const quickFilters = useMemo<OrderLandingPageFilter[]>(() => {
    const result: OrderLandingPageFilter[] = [];

    if (quickDatePreset !== 'all') {
      const { start, end } = getQuickDateRange(quickDatePreset);
      if (start && end) {
        // Use quickDateField to determine which column to filter (createdAt or entityDate)
        const columnName = quickDateField === 'createdAt' ? 'createdAt' : 'entityDate';
        
        // Format date based on column type:
        // - entityDate (Order Date): YYYY-MM-DD format (date only)
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

  // Convert column filters (Record<string, ActiveFilter[]>) to OrderLandingPageFilter[]
  const columnFiltersToAPI = useMemo<OrderLandingPageFilter[]>(() => {
    const filters: OrderLandingPageFilter[] = [];
    
    // Flatten all column filters into a single array
    Object.values(columnFilters).forEach((columnFilterArray) => {
      // Ensure columnFilterArray is always an array
      if (!Array.isArray(columnFilterArray)) return;
      
      columnFilterArray.forEach((filter) => {
        // Convert ActiveFilter to OrderLandingPageFilter
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
        const apiFilters: OrderLandingPageFilter[] = restoredFilters.map(f => {
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
          orderNumber: 'orderNumber',
          soldToCustomerName: 'customerName',
          factoryName: 'manufacturerName',
          entityDate: 'orderDate',
          total: 'total',
          commission: 'totalCommission',
          status: 'status',
        };
        const mappedField = fieldMap[savedView.sortField] || (savedView.sortField as SortField);
        setSortField(mappedField);
        setSortDirection(savedView.sortDirection || 'desc');
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
  const filters = useMemo<OrderLandingPageFilter[]>(() => {
    return [...quickFilters, ...serverFilters];
  }, [quickFilters, serverFilters]);

  // Build orderBy from sort state
  const orderBy = useMemo<OrderLandingPageOrderBy[]>(() => {
    return serverOrderBy;
  }, [serverOrderBy]);

  // Fetch orders from API with infinite scroll
  const {
    data: ordersData,
    isLoading,
    isFetching,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useOrdersInfinite(filters, orderBy);

  // Search orders
  const { data: searchResults, isLoading: isSearching } = useOrderSearch(searchQuery, 100);

  // Flatten paginated data and deduplicate by ID
  // This prevents React key conflicts when the same order appears in multiple pages
  const allOrdersData = useMemo(() => {
    if (!ordersData?.pages) return [];
    const allRecords = ordersData.pages.flatMap(page => page.records);
    
    // Deduplicate by ID, keeping the last occurrence of each order
    const uniqueMap = new Map<string, OrderLandingPage>();
    allRecords.forEach(record => {
      uniqueMap.set(record.id, record);
    });
    
    return Array.from(uniqueMap.values());
  }, [ordersData]);

  // Get total count
  const totalCount = useMemo(() => {
    if (!ordersData?.pages || ordersData.pages.length === 0) return 0;
    return ordersData.pages[0].total;
  }, [ordersData]);

  // Transform API data to UI format, using search results when searching
  const orders = useMemo(() => {
    // If searching and we have results, transform search results
    if (searchQuery.length >= 2 && searchResults) {
      // Deduplicate search results as well to prevent duplicate keys
      const seen = new Set<string>();
      const uniqueSearchResults = searchResults.filter((result: OrderSearchResult) => {
        if (seen.has(result.id)) return false;
        seen.add(result.id);
        return true;
      });
      
      return uniqueSearchResults.map((result: OrderSearchResult) => transformSearchResultToOrder(result));
    }

    if (!allOrdersData.length) return [];
    return allOrdersData.map(transformLandingPageToOrder);
  }, [allOrdersData, searchQuery, searchResults]);

  // Get filter options with unique values (for column filters)
  const orderFilterOptionsWithValues = useMemo(() => {
    // Extract unique values from orders for filter dropdowns
    return getOrderFilterOptions([], []);
  }, []);

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

  // Local orders state for optimistic updates (bulk actions, etc.)
  const [localOrders, setLocalOrders] = useState<Order[]>([]);

  // Use local orders if we have them (after mutations), otherwise use API orders
  const effectiveOrders = localOrders.length > 0 ? localOrders : orders;

  // Sync local orders when API data changes
  useMemo(() => {
    if (orders.length > 0 && localOrders.length === 0) {
      // Don't set local orders initially - let API be the source of truth
    }
  }, [orders, localOrders.length]);

  // Setter that updates local orders
  const setOrders = (updater: Order[] | ((prev: Order[]) => Order[])) => {
    if (typeof updater === 'function') {
      setLocalOrders(prev => updater(prev.length > 0 ? prev : orders));
    } else {
      setLocalOrders(updater);
    }
  };

  // Selected order for detail panel
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Create order modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Commission splits editing state
  const [editingSplits, setEditingSplits] = useState(false);
  const [editedSplits, setEditedSplits] = useState<OrderSplitRate[]>([]);

  // Integrate filter hook (for client-side filtering and other filter state)
  // Note: quickDatePreset, quickDateField, and sorting are now managed at this level for server-side
  const filterState = useOrderFilters(orders);
  
  // Extract filter state, excluding quick date filters, sorting, and columnFilters (we manage those at this level)
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
    columnFilters: _oldColumnFilters, // Exclude old columnFilters
    setColumnFilters: _oldSetColumnFilters, // Exclude old setColumnFilters
    clearAllFilters: _oldClearAllFilters, // Exclude old clearAllFilters - we define our own
    ...otherFilterState
  } = filterState;

  // Integrate selection hook
  const selectionState = useOrderSelection();

  // Integrate bulk actions hook
  const bulkActionsState = useOrderBulkActions({
    selectedOrderIds: selectionState.selectedOrderIds,
    clearSelection: selectionState.clearSelection,
    setOrders,
  });

  // Commission split editing functions
  const startEditingSplits = () => {
    if (selectedOrder) {
      setEditedSplits([...selectedOrder.splitRates]);
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
    if (selectedOrder) {
      updated[index].commissionAmount =
        (selectedOrder.totalCommission * newPercentage) / 100;
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

  // Clear all filters (advanced, column, quick date, and search)
  const clearAllFilters = useCallback(() => {
    setActiveFilters([]);
    setServerFilters([]);
    setColumnFilters({});
    setColumnFiltersToAPIState([]);
    setQuickDatePreset('all');
    setSearchQuery('');
  }, []);

  const saveSplits = () => {
    if (selectedOrder) {
      const totalPercentage = editedSplits.reduce(
        (sum, s) => sum + s.splitPercentage,
        0
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert('Split percentages must total 100%');
        return;
      }

      const updatedOrder = {
        ...selectedOrder,
        splitRates: editedSplits,
      };
      setOrders(orders.map((o) => (o.id === selectedOrder.id ? updatedOrder : o)));
      setSelectedOrder(updatedOrder);
      setEditingSplits(false);
      setEditedSplits([]);
    }
  };

  const splitPercentageTotal = editedSplits.reduce(
    (sum, s) => sum + s.splitPercentage,
    0
  );

  // Handle create order
  const handleCreateOrder = (newOrder: Order) => {
    setOrders([newOrder, ...orders]);
    setShowCreateModal(false);
    // Refetch to get fresh data from API
    refetch();
  };

  return {
    // Orders data
    orders,
    allOrdersData, // Raw OrderLandingPage[] data for export
    setOrders,
    // Loading and error state
    isLoading,
    isFetching,
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
    // Advanced filters
    activeFilters,
    handleServerFiltersChange,
    serverFilters,
    clearAllFilters,
    // Column filters
    columnFilters,
    handleColumnFiltersChange,
    orderFilterOptionsWithValues,
    // Quick date filters
    quickDatePreset,
    setQuickDatePreset,
    quickDateField,
    setQuickDateField,
    showQuickDateFieldDropdown,
    setShowQuickDateFieldDropdown,
    // Sorting
    sortField,
    sortDirection,
    handleMultiSortChange,
    serverOrderBy, // Expose for creating activeSorts
    // Selected order
    selectedOrder,
    setSelectedOrder,
    // Create modal
    showCreateModal,
    setShowCreateModal,
    handleCreateOrder,
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
    // Filter state and actions (excluding quick date filters managed above)
    ...otherFilterState,
    // Selection state and actions
    ...selectionState,
    // Bulk actions state and actions
    ...bulkActionsState,
  };
}
