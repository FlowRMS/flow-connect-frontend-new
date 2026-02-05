/**
 * Products State Hook
 * Manages UI state for the products list page
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  useProductsInfinite,
  useProductSearch,
  type ProductLandingPage,
  type ProductLandingPageFilter,
  type ProductLandingPageOrderBy,
  type ProductSearchResult,
  fetchAllProductIds,
} from '../api';
import type { ActiveFilter } from '../../advancedFilters/AdvancedFilters';
import { useBulkSelection } from '../../shared';

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

export function useProductsState() {
  // Client mounted state
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFactory, setSelectedFactory] = useState<string>('All');
  const [selectedPublishedStatus, setSelectedPublishedStatus] = useState<'All' | 'Published' | 'Draft'>('All');
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState<'All' | 'Needs Approval' | 'No Approval'>('All');

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showUomsModal, setShowUomsModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sort state
  const [sortState, setSortState] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);

  // Column filter state - now uses ActiveFilter[] format
  const [columnFilters, setColumnFilters] = useState<Record<string, ActiveFilter[]>>({});

  // Filter & sort state for advanced filters
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [clientSortColumns, setClientSortColumns] = useState<ActiveSort[]>([]);

  // Convert column filters to server format
  const columnFiltersToServer = useMemo(() => {
    const filters: ProductLandingPageFilter[] = [];
    
    // Convert column filters to server format
    Object.values(columnFilters).forEach(filterArray => {
      filterArray.forEach(f => {
        filters.push({
          operator: f.operator,
          columnName: f.columnName,
          value: f.value,
          values: f.values,
        });
      });
    });

    return filters;
  }, [columnFilters]);

  // Convert to server format for API - combine advanced filters and column filters
  const serverFilters: ProductLandingPageFilter[] | undefined = useMemo(() => {
    const filters: ProductLandingPageFilter[] = [];

    // Add advanced filters
    activeFilters.forEach(f => {
      filters.push({
        operator: f.operator,
        columnName: f.columnName,
        value: f.value,
        values: f.values,
      });
    });

    // Add column filters
    columnFiltersToServer.forEach(f => {
      filters.push(f);
    });

    return filters.length > 0 ? filters : undefined;
  }, [activeFilters, columnFiltersToServer]);

  const serverOrderBy: ProductLandingPageOrderBy[] | undefined = useMemo(() => {
    if (clientSortColumns.length === 0) return undefined;
    // Convert all sort columns to server format
    return clientSortColumns.map(sort => ({
      columnName: sort.columnName,
      direction: sort.direction,
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
  } = useProductsInfinite(serverFilters, serverOrderBy);

  // Also use product search for debounced search
  const {
    data: searchResults,
    isLoading: isSearching,
  } = useProductSearch(
    searchQuery.length >= 2 ? searchQuery : undefined,
    selectedFactory !== 'All' ? selectedFactory : undefined,
    undefined,
    50
  );

  // Flatten paginated data
  const products: ProductLandingPage[] = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.records);
  }, [data]);

  // Total count
  const totalCount = useMemo(() => {
    if (!data?.pages || data.pages.length === 0) return 0;
    return data.pages[0].total;
  }, [data]);

  // Bulk selection with shared hook
  const bulkSelection = useBulkSelection({
    items: products,
    totalCount,
    fetchAllIds: () => fetchAllProductIds(serverFilters, serverOrderBy),
  });

  // Bulk delete modal state
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Handle bulk delete success
  const handleBulkDeleteSuccess = useCallback(() => {
    bulkSelection.clearSelection();
    setShowBulkDeleteModal(false);
    refetch();
  }, [bulkSelection, refetch]);

  // Products are already filtered by the backend, so we just use them directly
  // Only apply client-side search for short queries (< 2 chars) as fallback
  const filteredProducts = useMemo(() => {
    // If we have search results from the API, use those
    if (searchQuery.length >= 2 && searchResults) {
      // Convert ProductSearchResult to ProductLandingPage format
      // Note: category, uom, factory are not available in the search results
      return searchResults.map((p: ProductSearchResult) => ({
        id: p.id,
        factoryPartNumber: p.factoryPartNumber,
        description: p.description,
        unitPrice: p.unitPrice,
        defaultCommissionRate: p.defaultCommissionRate,
        approvalNeeded: p.approvalNeeded,
        published: p.published,
        categoryTitle: undefined,
        uomTitle: undefined,
        factoryTitle: undefined,
      })) as ProductLandingPage[];
    }

    // For short queries, apply client-side filtering as fallback
    if (searchQuery.trim() && searchQuery.length < 2) {
      const query = searchQuery.toLowerCase();
      return products.filter(product =>
        product.factoryPartNumber?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.factoryTitle?.toLowerCase().includes(query) ||
        product.categoryTitle?.toLowerCase().includes(query)
      );
    }

    // Otherwise, return products as-is (already filtered by backend)
    return products;
  }, [products, searchQuery, searchResults]);

  // Unique values for filter dropdowns
  const uniqueFactories = useMemo(() => getUniqueValues(products, 'factoryTitle'), [products]);
  const uniqueCategories = useMemo(() => getUniqueValues(products, 'categoryTitle'), [products]);
  const uniqueUoms = useMemo(() => getUniqueValues(products, 'uomTitle'), [products]);

  // Stats
  const stats = useMemo(() => ({
    totalProducts: totalCount,
    publishedProducts: products.filter(p => p.published).length,
    draftProducts: products.filter(p => !p.published).length,
    needsApproval: products.filter(p => p.approvalNeeded).length,
    uniqueCategories: uniqueCategories.length,
    uniqueFactories: uniqueFactories.length,
  }), [totalCount, products, uniqueCategories.length, uniqueFactories.length]);

  // Scroll handler for infinite scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    // Load more when within 200px of bottom
    if (scrollHeight - scrollTop - clientHeight < 200) {
      if (hasNextPage && !isFetchingNextPage && searchQuery.length < 2) {
        fetchNextPage();
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, searchQuery]);

  // Handlers
  const handleSort = useCallback((column: string) => {
    setSortState((prev) => {
      if (prev?.column !== column) {
        return { column, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { column, direction: 'desc' };
      }
      return null;
    });
  }, []);

  // Handler for column filter changes (from ColumnFilters component)
  const handleColumnFiltersChange = useCallback((filters: Record<string, ActiveFilter[]>) => {
    setColumnFilters(filters);
  }, []);

  const handleFiltersChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
  }, []);

  const handleMultiSortChange = useCallback((sorts: ActiveSort[]) => {
    setClientSortColumns(sorts);
  }, []);

  const handleProductDeleted = useCallback(() => {
    setDeleteConfirmId(null);
  }, []);

  return {
    // State
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    selectedFactory,
    setSelectedFactory,
    selectedPublishedStatus,
    setSelectedPublishedStatus,
    selectedApprovalStatus,
    setSelectedApprovalStatus,
    products,
    filteredProducts,
    stats,
    totalCount,

    // Sort state
    sortState,
    handleSort,
    columnFilters,
    handleColumnFiltersChange,

    // Modal state
    showCreateModal,
    setShowCreateModal,
    showCategoriesModal,
    setShowCategoriesModal,
    showUomsModal,
    setShowUomsModal,
    deleteConfirmId,
    setDeleteConfirmId,

    // Loading state
    isLoading: isLoading || isSearching,
    error,
    refetch,
    isMounted,

    // Pagination
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    handleScroll,

    // Filter and sort
    activeFilters,
    setActiveFilters,
    clientSortColumns,
    setClientSortColumns,
    uniqueFactories,
    uniqueCategories,
    uniqueUoms,
    handleFiltersChange,
    handleMultiSortChange,

    // Handlers
    handleProductDeleted,

    // Bulk selection (from shared hook)
    selectedIds: bulkSelection.selectedIds,
    excludedIds: bulkSelection.excludedIds,
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
