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
import { formatDateToISO } from '../../../advancedFilters/utils';

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
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Quick date filter state - defined BEFORE API hook
  const [quickDatePreset, setQuickDatePreset] = useState<QuickDatePreset>('all');
  const [quickDateField, setQuickDateField] = useState<QuickDateField>('createdAt');
  const [showQuickDateFieldDropdown, setShowQuickDateFieldDropdown] = useState(false);

  // Server-side filters - defined BEFORE API hook so they can be passed to the query
  const [serverFilters, setServerFilters] = useState<OrderLandingPageFilter[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  
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
  
  // Handler for server-side filter changes
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
  }, []);

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
        'orderNumber': 'orderNumber',
        'soldToCustomerName': 'customerName',
        'factoryName': 'manufacturerName',
        'entityDate': 'orderDate',
        'total': 'total',
        'commission': 'totalCommission',
        'status': 'status',
      };
      
      const mappedField = fieldMap[sort.columnName];
      if (mappedField) {
        setSortField(mappedField);
        setSortDirection(sort.direction.toLowerCase() as SortDirection);
      }
    } else {
      // Clear sort
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
        // - createdAt: ISO string format (datetime with time)
        const formatDate = (date: Date): string => {
          if (columnName === 'entityDate') {
            return formatDateToISO(date); // Returns YYYY-MM-DD
          }
          return date.toISOString(); // Returns full ISO datetime
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

  // Combine quick filters with advanced filters
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
      return searchResults.map((result: OrderSearchResult) => transformSearchResultToOrder(result));
    }

    if (!allOrdersData.length) return [];
    return allOrdersData.map(transformLandingPageToOrder);
  }, [allOrdersData, searchQuery, searchResults]);

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
  
  // Extract filter state, excluding quick date filters and sorting (we manage those at this level)
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
    setOrders,
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
    // Advanced filters
    activeFilters,
    handleServerFiltersChange,
    serverFilters,
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
    handleSortChange,
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
