/**
 * useStatementsListState Hook
 * Main state management hook for the statements list
 * Integrates all sub-hooks and manages overall state
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  useStatementsInfinite,
  useStatementSearch,
  useStatement,
  fetchAllStatementIds,
  type StatementLandingPage,
  type StatementLandingPageFilter,
  type StatementLandingPageOrderBy,
  type Statement,
} from '../../api';
import { useBulkSelection } from '../../../shared';
import type { QuickDatePreset, QuickDateField, SortField, SortDirection, StatementListItem } from '../../types';
import { getStatementFilterOptions } from '../config/filterConfig';
import type { ActiveFilter } from '../../../advancedFilters/types';
import { formatDateToISO, formatDateToBackend } from '../../../advancedFilters/utils';

/**
 * Get date range for quick date presets
 */
function getQuickDateRange(preset: QuickDatePreset): { start: Date | null; end: Date | null } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { start: today, end: new Date(today.getTime() + 86400000 - 1) };
    case 'yesterday': {
      const yesterday = new Date(today.getTime() - 86400000);
      return { start: yesterday, end: new Date(yesterday.getTime() + 86400000 - 1) };
    }
    case 'thisWeek': {
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today.getTime() - dayOfWeek * 86400000);
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 86400000 - 1);
      return { start: startOfWeek, end: endOfWeek };
    }
    case 'lastWeek': {
      const dayOfWeek = today.getDay();
      const startOfLastWeek = new Date(today.getTime() - (dayOfWeek + 7) * 86400000);
      const endOfLastWeek = new Date(startOfLastWeek.getTime() + 7 * 86400000 - 1);
      return { start: startOfLastWeek, end: endOfLastWeek };
    }
    case 'thisMonth': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
      return { start: startOfMonth, end: endOfMonth };
    }
    case 'lastMonth': {
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
      return { start: startOfLastMonth, end: endOfLastMonth };
    }
    case 'thisQuarter': {
      const quarter = Math.floor(today.getMonth() / 3);
      const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
      const endOfQuarter = new Date(today.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59);
      return { start: startOfQuarter, end: endOfQuarter };
    }
    case 'lastQuarter': {
      const quarter = Math.floor(today.getMonth() / 3) - 1;
      const year = quarter < 0 ? today.getFullYear() - 1 : today.getFullYear();
      const adjQuarter = quarter < 0 ? 3 : quarter;
      const startOfQuarter = new Date(year, adjQuarter * 3, 1);
      const endOfQuarter = new Date(year, adjQuarter * 3 + 3, 0, 23, 59, 59);
      return { start: startOfQuarter, end: endOfQuarter };
    }
    case 'thisYear': {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
      return { start: startOfYear, end: endOfYear };
    }
    case 'lastYear': {
      const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
      const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59);
      return { start: startOfLastYear, end: endOfLastYear };
    }
    default:
      return { start: null, end: null };
  }
}

/**
 * Map UI SortField to API columnName
 */
function mapSortFieldToColumnName(sortField: SortField): string {
  const fieldMap: Record<SortField, string> = {
    statementNumber: 'statementNumber',
    factoryName: 'factoryName',
    entityDate: 'entityDate',
    total: 'total',
    commission: 'commission',
    createdAt: 'createdAt',
  };
  return fieldMap[sortField] || 'entityDate';
}

/**
 * Transform StatementLandingPage from API to UI StatementListItem type
 */
function transformLandingPageToListItem(landing: StatementLandingPage): StatementListItem {
  return {
    id: landing.id,
    statementNumber: landing.statementNumber || '',
    entityDate: landing.entityDate || '',
    factoryId: '',
    factoryName: landing.factoryName || '-',
    total: landing.total || 0,
    commission: landing.commission || 0,
    createdAt: landing.createdAt || '',
    createdBy: typeof landing.createdBy === 'string' ? landing.createdBy : '',
    userIds: landing.userIds,
  };
}

export function useStatementsListState() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Quick date filter state
  const [quickDatePreset, setQuickDatePreset] = useState<QuickDatePreset>('all');
  const [quickDateField, setQuickDateField] = useState<QuickDateField>('entityDate');
  const [showQuickDateFieldDropdown, setShowQuickDateFieldDropdown] = useState(false);

  // Server-side filters
  const [serverFilters, setServerFilters] = useState<StatementLandingPageFilter[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, ActiveFilter[]>>({});
  const [columnFiltersToAPIState, setColumnFiltersToAPIState] = useState<StatementLandingPageFilter[]>([]);

  // Refs to prevent infinite loops during synchronization
  const isSyncingFromAdvanced = useRef(false);
  const isSyncingFromColumn = useRef(false);

  // Sort state
  const [serverOrderBy, setServerOrderBy] = useState<StatementLandingPageOrderBy[]>(() => {
    return [{
      columnName: mapSortFieldToColumnName('entityDate'),
      direction: 'DESC',
    }];
  });

  // UI sort state (for backwards compatibility)
  const [sortField, setSortField] = useState<SortField>('entityDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Selected statement for detail panel
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);

  // Bulk delete modal
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Filter options
  const statementFilterOptions = useMemo(() => getStatementFilterOptions(), []);

  // Handler for server-side filter changes (from AdvancedFilters)
  const handleServerFiltersChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);

    const apiFilters: StatementLandingPageFilter[] = filters.map(f => {
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

    // Sync to ColumnFilters
    if (!isSyncingFromColumn.current) {
      isSyncingFromAdvanced.current = true;

      const syncedColumnFilters: Record<string, ActiveFilter[]> = {};
      filters.forEach((filter) => {
        // Use columnName directly as the key
        syncedColumnFilters[filter.columnName] = [filter];
      });

      setColumnFilters((prev) => {
        if (filters.length === 0) return {};
        return { ...prev, ...syncedColumnFilters };
      });
      setTimeout(() => {
        isSyncingFromAdvanced.current = false;
      }, 0);
    }
  }, []);

  // Handler for column filter changes
  const handleColumnFiltersChange = useCallback((filters: Record<string, ActiveFilter[]>) => {
    setColumnFilters(filters);

    if (!isSyncingFromAdvanced.current) {
      isSyncingFromColumn.current = true;
      const syncedActiveFilters: ActiveFilter[] = [];
      Object.values(filters).forEach((filterArray) => {
        if (Array.isArray(filterArray)) {
          filterArray.forEach((filter) => {
            syncedActiveFilters.push(filter);
          });
        }
      });
      setActiveFilters(syncedActiveFilters);

      const apiFilters: StatementLandingPageFilter[] = syncedActiveFilters.map(f => {
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
      setTimeout(() => {
        isSyncingFromColumn.current = false;
      }, 0);
    }
  }, []);

  // Build quick filters based on quick date filter selection
  const quickFilters = useMemo<StatementLandingPageFilter[]>(() => {
    const result: StatementLandingPageFilter[] = [];

    if (quickDatePreset !== 'all') {
      const { start, end } = getQuickDateRange(quickDatePreset);
      if (start && end) {
        const columnName = quickDateField === 'createdAt' ? 'createdAt' : 'entityDate';

        const formatDate = (date: Date): string => {
          if (columnName === 'entityDate') {
            return formatDateToISO(date);
          }
          return formatDateToBackend(date);
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

  // Convert column filters to API format
  const columnFiltersToAPI = useMemo<StatementLandingPageFilter[]>(() => {
    const filters: StatementLandingPageFilter[] = [];

    Object.values(columnFilters).forEach((columnFilterArray) => {
      if (!Array.isArray(columnFilterArray)) return;

      columnFilterArray.forEach((filter) => {
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

  // Combine quick filters with server filters (serverFilters already contains synced column filters)
  const filters = useMemo<StatementLandingPageFilter[]>(() => {
    return [...quickFilters, ...serverFilters];
  }, [quickFilters, serverFilters]);

  // Build orderBy from sort state
  const orderBy = useMemo<StatementLandingPageOrderBy[]>(() => {
    return serverOrderBy;
  }, [serverOrderBy]);

  // Fetch statements from API with infinite scroll
  const {
    data: statementsData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStatementsInfinite(filters, orderBy);

  // Search statements
  const { data: searchResults, isLoading: isSearching } = useStatementSearch(
    searchQuery,
    searchQuery.length >= 2
  );

  // Fetch selected statement details
  const { data: selectedStatementDetails, isLoading: isLoadingDetails } = useStatement(selectedStatementId);

  // Flatten paginated data with deduplication
  const allStatementsData = useMemo(() => {
    if (!statementsData?.pages) return [];
    const allRecords = statementsData.pages.flatMap(page => page.records);
    const seen = new Set<string>();
    return allRecords.filter(record => {
      if (seen.has(record.id)) return false;
      seen.add(record.id);
      return true;
    });
  }, [statementsData]);

  // Get total count
  const totalCount = useMemo(() => {
    if (!statementsData?.pages || statementsData.pages.length === 0) return 0;
    return statementsData.pages[0].total;
  }, [statementsData]);

  // Transform API data to UI format, using search results when searching
  const statements: StatementListItem[] = useMemo(() => {
    if (searchQuery.length >= 2 && searchResults) {
      const seen = new Set<string>();
      const uniqueSearchResults = searchResults.filter((result) => {
        if (seen.has(result.id)) return false;
        seen.add(result.id);
        return true;
      });

      return uniqueSearchResults.map((result): StatementListItem => ({
        id: result.id,
        statementNumber: result.statementNumber || '',
        entityDate: result.entityDate || '',
        factoryId: result.factoryId || '',
        factoryName: '-',
        total: 0,
        commission: 0,
        createdAt: result.createdAt || '',
        createdBy: '',
      }));
    }

    if (!allStatementsData.length) return [];
    return allStatementsData.map(transformLandingPageToListItem);
  }, [allStatementsData, searchQuery, searchResults]);

  // Scroll handler for infinite scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      if (hasNextPage && !isFetchingNextPage && !searchQuery) {
        fetchNextPage();
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, searchQuery]);

  // Integrate shared bulk selection hook
  const bulkSelection = useBulkSelection({
    items: statements,
    totalCount,
    fetchAllIds: fetchAllStatementIds,
  });

  // Handle successful bulk delete
  const handleBulkDeleteSuccess = useCallback(() => {
    bulkSelection.clearSelection();
    setShowBulkDeleteModal(false);
    refetch();
  }, [bulkSelection, refetch]);

  // Selection handlers (compatibility layer)
  const selectedStatementIds = bulkSelection.selectedIds;
  const toggleStatementSelection = useCallback((statementId: string) => {
    bulkSelection.handleSelectOne(statementId, !bulkSelection.isItemSelected(statementId));
  }, [bulkSelection]);
  const selectAllStatements = useCallback(() => {
    bulkSelection.handleSelectAll(true);
  }, [bulkSelection]);
  const clearSelection = bulkSelection.clearSelection;
  const areAllEligibleSelected = bulkSelection.isAllSelected;

  // Handler for server-side sort changes
  const handleSortChange = useCallback((sort: { columnName: string; direction: 'ASC' | 'DESC' } | undefined) => {
    if (sort) {
      setServerOrderBy([{
        columnName: sort.columnName,
        direction: sort.direction,
      }]);

      const fieldMap: Record<string, SortField> = {
        'statementNumber': 'statementNumber',
        'factoryName': 'factoryName',
        'entityDate': 'entityDate',
        'total': 'total',
        'commission': 'commission',
        'createdAt': 'createdAt',
      };

      const mappedField = fieldMap[sort.columnName];
      if (mappedField) {
        setSortField(mappedField);
        setSortDirection(sort.direction.toLowerCase() as SortDirection);
      }
    } else {
      setServerOrderBy([{
        columnName: mapSortFieldToColumnName('entityDate'),
        direction: 'DESC',
      }]);
      setSortField('entityDate');
      setSortDirection('desc');
    }
  }, []);

  // Set selected statement
  const setSelectedStatement = useCallback((statement: StatementListItem | null) => {
    setSelectedStatementId(statement?.id || null);
  }, []);

  return {
    // Statements data
    statements,
    selectedStatement: selectedStatementDetails || null,
    selectedStatementId,
    setSelectedStatement,
    isLoadingDetails,

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

    // Quick date filters
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

    // Column filters
    columnFilters,
    handleColumnFiltersChange,
    statementFilterOptions,

    // Sorting
    sortField,
    sortDirection,
    handleSortChange,

    // Selection
    selectedStatementIds,
    toggleStatementSelection,
    selectAllStatements,
    clearSelection,
    areAllEligibleSelected,
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
  };
}
