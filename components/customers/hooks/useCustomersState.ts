/**
 * Customers State Hook
 * Manages UI state for the customers list page
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useCustomersInfinite, type CustomerLandingPage, type CustomerLandingPageFilter, type CustomerLandingPageOrderBy } from '../api/useCustomersApi';
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

  // Flatten paginated data
  const customers: CustomerLandingPage[] = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.records);
  }, [data]);

  // Apply client-side search filtering
  const filteredCustomers = useMemo(() => {
    let result = customers;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(customer =>
        customer.companyName?.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (selectedType === 'Parent') {
      result = result.filter(c => c.isParent);
    } else if (selectedType === 'Child') {
      result = result.filter(c => !c.isParent);
    }

    return result;
  }, [customers, searchQuery, selectedType]);

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

    // Loading state
    isLoading,
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
