/**
 * Customers State Hook
 * Manages UI state for the customers list page
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useCustomersInfinite, useCustomerSearch, type CustomerLandingPage, type CustomerLandingPageFilter, type CustomerLandingPageOrderBy, type CustomerSearchResult } from '../api/useCustomersApi';
import type { ActiveFilter } from '../../AdvancedFilters';

export type ViewMode = 'list' | 'grid';

export interface ActiveSort {
  columnName: string;
  direction: 'ASC' | 'DESC';
}

// Helper to get unique values from an array of objects
function getUniqueValues<T, K extends keyof T>(items: T[], key: K): string[] {
  const values = items.map(item => item[key]).filter(Boolean);
  return [...new Set(values as string[])];
}

// Apply filter to a single customer
function applyFilterUtil(customer: CustomerLandingPage, filter: ActiveFilter): boolean {
  const value = customer[filter.columnName as keyof CustomerLandingPage];
  const stringValue = String(value || '').toLowerCase();

  switch (filter.operator) {
    case 'EQ':
      return stringValue === String(filter.value || '').toLowerCase();
    case 'NE':
      return stringValue !== String(filter.value || '').toLowerCase();
    case 'LIKE':
    case 'ILIKE':
      return stringValue.includes(String(filter.value || '').toLowerCase());
    case 'IN':
      return (filter.values || []).some(v => stringValue.includes(v.toLowerCase()));
    case 'IS_NULL':
      return !value;
    case 'IS_NOT_NULL':
      return !!value;
    default:
      return true;
  }
}

export function useCustomersState() {
  // Client mounted state
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'All' | 'Parent' | 'Child'>('All');

  // Delete modal state (other modals replaced by dedicated pages)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Filter & sort state
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [clientSortColumns, setClientSortColumns] = useState<ActiveSort[]>([]);

  // Convert to server format for API
  const serverFilters: CustomerLandingPageFilter[] | undefined = useMemo(() => {
    if (activeFilters.length === 0) return undefined;
    return activeFilters.map(f => ({
      operator: f.operator,
      columnName: f.columnName,
      value: f.value,
      values: f.values,
    }));
  }, [activeFilters]);

  const serverOrderBy: CustomerLandingPageOrderBy[] | undefined = useMemo(() => {
    if (clientSortColumns.length === 0) return undefined;
    return clientSortColumns.map(s => ({
      columnName: s.columnName,
      direction: s.direction,
    }));
  }, [clientSortColumns]);

  // Fetch data with infinite query
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCustomersInfinite(serverFilters, serverOrderBy);

  // Search customers using server-side search
  const { data: searchResults, isLoading: isSearching } = useCustomerSearch(searchQuery, 100);

  // Flatten paginated data
  const customers: CustomerLandingPage[] = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.records);
  }, [data]);

  // Transform search results to CustomerLandingPage format
  const transformSearchResultToLandingPage = (result: CustomerSearchResult): CustomerLandingPage => ({
    id: result.id,
    companyName: result.companyName,
    isParent: result.isParent ?? false,
    published: result.published ?? true,
    createdAt: undefined,
    createdBy: undefined,
    insideReps: undefined,
    outsideReps: undefined,
  });

  // Apply filtering - use server search results when searching, otherwise use paginated data
  const filteredCustomers = useMemo(() => {
    // If searching and we have results, use search results
    if (searchQuery.length >= 2 && searchResults) {
      let result = searchResults.map(transformSearchResultToLandingPage);

      // Apply type filter to search results
      if (selectedType === 'Parent') {
        result = result.filter(c => c.isParent);
      } else if (selectedType === 'Child') {
        result = result.filter(c => !c.isParent);
      }

      return result;
    }

    // Otherwise use paginated data with type filter only
    let result = customers;

    // Apply type filter
    if (selectedType === 'Parent') {
      result = result.filter(c => c.isParent);
    } else if (selectedType === 'Child') {
      result = result.filter(c => !c.isParent);
    }

    return result;
  }, [customers, searchQuery, searchResults, selectedType]);

  // Unique values for filter dropdowns
  const uniqueCompanyNames = useMemo(() => getUniqueValues(customers, 'companyName'), [customers]);

  // Handlers
  const handleFiltersChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
  }, []);

  const handleMultiSortChange = useCallback((sorts: ActiveSort[]) => {
    setClientSortColumns(sorts);
  }, []);

  const handleCustomerDeleted = useCallback(() => {
    setDeleteConfirmId(null);
  }, []);

  // Selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredCustomers.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [filteredCustomers]);

  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleBulkDeleteSuccess = useCallback(() => {
    setSelectedIds(new Set());
    setShowBulkDeleteModal(false);
  }, []);

  const isAllSelected = filteredCustomers.length > 0 && selectedIds.size === filteredCustomers.length;
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < filteredCustomers.length;

  return {
    // State
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    customers,
    filteredCustomers,

    // Delete modal state
    deleteConfirmId,
    setDeleteConfirmId,

    // Selection state for bulk operations
    selectedIds,
    setSelectedIds,
    showBulkDeleteModal,
    setShowBulkDeleteModal,
    handleSelectAll,
    handleSelectOne,
    handleBulkDeleteSuccess,
    isAllSelected,
    isPartiallySelected,

    // Loading state
    isLoading,
    isSearching,
    error,
    refetch,
    isMounted,

    // Pagination
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,

    // Filter and sort
    activeFilters,
    setActiveFilters,
    clientSortColumns,
    setClientSortColumns,
    uniqueCompanyNames,
    handleFiltersChange,
    handleMultiSortChange,

    // Handlers
    handleCustomerDeleted,
  };
}
