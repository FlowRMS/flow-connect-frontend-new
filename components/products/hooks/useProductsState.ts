/**
 * Products State Hook
 * Manages UI state for the products list page
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  useProductsInfinite,
  useProductSearch,
  type ProductLandingPage,
  type ProductLandingPageFilter,
  type ProductLandingPageOrderBy,
  type ProductSearchResult,
} from '../api/useProductsApi';
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

  // Column filter state
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({
    factoryPartNumber: '',
    description: '',
    factoryTitle: '',
    categoryTitle: '',
    published: '',
    approvalNeeded: '',
  });

  // Filter & sort state for advanced filters
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [clientSortColumns, setClientSortColumns] = useState<ActiveSort[]>([]);

  // Convert to server format for API
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

    return filters.length > 0 ? filters : undefined;
  }, [activeFilters]);

  const serverOrderBy: ProductLandingPageOrderBy | undefined = useMemo(() => {
    if (clientSortColumns.length === 0) return undefined;
    return {
      columnName: clientSortColumns[0].columnName,
      direction: clientSortColumns[0].direction,
    };
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

  // Apply client-side search and filtering
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

    let result = products;

    // Apply search query (client-side fallback for short queries)
    if (searchQuery.trim() && searchQuery.length < 2) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product =>
        product.factoryPartNumber?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.factoryTitle?.toLowerCase().includes(query) ||
        product.categoryTitle?.toLowerCase().includes(query)
      );
    }

    // Apply factory filter
    if (selectedFactory !== 'All') {
      result = result.filter(p => p.factoryTitle === selectedFactory);
    }

    // Apply published status filter
    if (selectedPublishedStatus === 'Published') {
      result = result.filter(p => p.published === true);
    } else if (selectedPublishedStatus === 'Draft') {
      result = result.filter(p => p.published === false);
    }

    // Apply approval status filter
    if (selectedApprovalStatus === 'Needs Approval') {
      result = result.filter(p => p.approvalNeeded === true);
    } else if (selectedApprovalStatus === 'No Approval') {
      result = result.filter(p => p.approvalNeeded === false);
    }

    // Apply column filters
    if (columnFilters.factoryPartNumber) {
      const query = columnFilters.factoryPartNumber.toLowerCase();
      result = result.filter(p => p.factoryPartNumber?.toLowerCase().includes(query));
    }
    if (columnFilters.description) {
      const query = columnFilters.description.toLowerCase();
      result = result.filter(p => p.description?.toLowerCase().includes(query));
    }
    if (columnFilters.factoryTitle) {
      result = result.filter(p => p.factoryTitle === columnFilters.factoryTitle);
    }
    if (columnFilters.categoryTitle) {
      result = result.filter(p => p.categoryTitle === columnFilters.categoryTitle);
    }
    if (columnFilters.published) {
      const isPublished = columnFilters.published === 'Published';
      result = result.filter(p => p.published === isPublished);
    }
    if (columnFilters.approvalNeeded) {
      const needsApproval = columnFilters.approvalNeeded === 'Yes';
      result = result.filter(p => p.approvalNeeded === needsApproval);
    }

    // Apply sorting
    if (sortState) {
      result = [...result].sort((a, b) => {
        let aVal: string | number | boolean | undefined;
        let bVal: string | number | boolean | undefined;

        switch (sortState.column) {
          case 'factoryPartNumber':
            aVal = a.factoryPartNumber;
            bVal = b.factoryPartNumber;
            break;
          case 'description':
            aVal = a.description;
            bVal = b.description;
            break;
          case 'factoryTitle':
            aVal = a.factoryTitle;
            bVal = b.factoryTitle;
            break;
          case 'categoryTitle':
            aVal = a.categoryTitle;
            bVal = b.categoryTitle;
            break;
          case 'unitPrice':
            aVal = a.unitPrice;
            bVal = b.unitPrice;
            break;
          case 'defaultCommissionRate':
            aVal = a.defaultCommissionRate;
            bVal = b.defaultCommissionRate;
            break;
          case 'published':
            aVal = a.published;
            bVal = b.published;
            break;
          case 'approvalNeeded':
            aVal = a.approvalNeeded;
            bVal = b.approvalNeeded;
            break;
          default:
            return 0;
        }

        // Handle numeric values
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortState.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        // Handle boolean values
        if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
          const cmp = aVal === bVal ? 0 : aVal ? -1 : 1;
          return sortState.direction === 'asc' ? cmp : -cmp;
        }

        // Handle string values
        const aStr = String(aVal ?? '').toLowerCase();
        const bStr = String(bVal ?? '').toLowerCase();
        const cmp = aStr.localeCompare(bStr);
        return sortState.direction === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [products, searchQuery, searchResults, selectedFactory, selectedPublishedStatus, selectedApprovalStatus, columnFilters, sortState]);

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

  const handleColumnFilterChange = useCallback((column: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }));
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
    handleColumnFilterChange,

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
  };
}
