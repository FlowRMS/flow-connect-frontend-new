/**
 * Tests for SubmittalsContent Component Logic
 * These tests verify the business logic and data transformations
 */

import type { SubmittalStatusGQL } from '../../lib/graphql/submittals';

describe('SubmittalsContent - Filtering Logic', () => {
  interface SubmittalListItem {
    id: string;
    submittalNumber: string;
    status: SubmittalStatusGQL;
    description: string | null;
    jobName?: string;
  }

  function filterSubmittals(
    submittals: SubmittalListItem[],
    filters: {
      searchQuery: string;
      statusFilter: SubmittalStatusGQL | 'all';
    }
  ): SubmittalListItem[] {
    let result = [...submittals];

    // Status filter
    if (filters.statusFilter !== 'all') {
      result = result.filter((s) => s.status === filters.statusFilter);
    }

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.submittalNumber.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          s.jobName?.toLowerCase().includes(query)
      );
    }

    return result;
  }

  const mockSubmittals: SubmittalListItem[] = [
    {
      id: '1',
      submittalNumber: 'SUB-001',
      status: 'DRAFT',
      description: 'First submittal',
      jobName: 'Project Alpha',
    },
    {
      id: '2',
      submittalNumber: 'SUB-002',
      status: 'SUBMITTED',
      description: 'Second submittal',
      jobName: 'Project Beta',
    },
    {
      id: '3',
      submittalNumber: 'SUB-003',
      status: 'APPROVED',
      description: 'Third submittal',
      jobName: 'Project Alpha',
    },
    {
      id: '4',
      submittalNumber: 'SUB-004',
      status: 'DRAFT',
      description: null,
      jobName: 'Project Gamma',
    },
  ];

  it('should return all submittals when no filters applied', () => {
    const result = filterSubmittals(mockSubmittals, {
      searchQuery: '',
      statusFilter: 'all',
    });

    expect(result).toHaveLength(4);
  });

  it('should filter by status', () => {
    const result = filterSubmittals(mockSubmittals, {
      searchQuery: '',
      statusFilter: 'DRAFT',
    });

    expect(result).toHaveLength(2);
    expect(result.every((s) => s.status === 'DRAFT')).toBe(true);
  });

  it('should filter by search query (submittal number)', () => {
    const result = filterSubmittals(mockSubmittals, {
      searchQuery: 'SUB-001',
      statusFilter: 'all',
    });

    expect(result).toHaveLength(1);
    expect(result[0].submittalNumber).toBe('SUB-001');
  });

  it('should filter by search query (description)', () => {
    const result = filterSubmittals(mockSubmittals, {
      searchQuery: 'First',
      statusFilter: 'all',
    });

    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('First submittal');
  });

  it('should filter by search query (job name)', () => {
    const result = filterSubmittals(mockSubmittals, {
      searchQuery: 'Alpha',
      statusFilter: 'all',
    });

    expect(result).toHaveLength(2);
    expect(result.every((s) => s.jobName?.includes('Alpha'))).toBe(true);
  });

  it('should combine status and search filters', () => {
    const result = filterSubmittals(mockSubmittals, {
      searchQuery: 'Alpha',
      statusFilter: 'DRAFT',
    });

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('DRAFT');
    expect(result[0].jobName).toBe('Project Alpha');
  });

  it('should be case insensitive', () => {
    const result = filterSubmittals(mockSubmittals, {
      searchQuery: 'ALPHA',
      statusFilter: 'all',
    });

    expect(result).toHaveLength(2);
  });

  it('should handle null description', () => {
    const result = filterSubmittals(mockSubmittals, {
      searchQuery: 'Gamma',
      statusFilter: 'all',
    });

    expect(result).toHaveLength(1);
    expect(result[0].description).toBeNull();
  });
});

describe('SubmittalsContent - Sorting Logic', () => {
  interface SubmittalListItem {
    id: string;
    submittalNumber: string;
    createdAt: string;
    status: SubmittalStatusGQL;
  }

  type SortField = 'submittalNumber' | 'createdAt' | 'status';
  type SortOrder = 'asc' | 'desc';

  function sortSubmittals(
    submittals: SubmittalListItem[],
    sortBy: SortField,
    order: SortOrder
  ): SubmittalListItem[] {
    const sorted = [...submittals].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'submittalNumber':
          comparison = a.submittalNumber.localeCompare(b.submittalNumber);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return order === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }

  const mockSubmittals: SubmittalListItem[] = [
    { id: '1', submittalNumber: 'SUB-003', createdAt: '2024-01-15T00:00:00Z', status: 'DRAFT' },
    { id: '2', submittalNumber: 'SUB-001', createdAt: '2024-01-10T00:00:00Z', status: 'APPROVED' },
    { id: '3', submittalNumber: 'SUB-002', createdAt: '2024-01-20T00:00:00Z', status: 'SUBMITTED' },
  ];

  it('should sort by submittal number ascending', () => {
    const result = sortSubmittals(mockSubmittals, 'submittalNumber', 'asc');

    expect(result[0].submittalNumber).toBe('SUB-001');
    expect(result[1].submittalNumber).toBe('SUB-002');
    expect(result[2].submittalNumber).toBe('SUB-003');
  });

  it('should sort by submittal number descending', () => {
    const result = sortSubmittals(mockSubmittals, 'submittalNumber', 'desc');

    expect(result[0].submittalNumber).toBe('SUB-003');
    expect(result[2].submittalNumber).toBe('SUB-001');
  });

  it('should sort by created date ascending', () => {
    const result = sortSubmittals(mockSubmittals, 'createdAt', 'asc');

    expect(result[0].createdAt).toBe('2024-01-10T00:00:00Z');
    expect(result[2].createdAt).toBe('2024-01-20T00:00:00Z');
  });

  it('should sort by created date descending', () => {
    const result = sortSubmittals(mockSubmittals, 'createdAt', 'desc');

    expect(result[0].createdAt).toBe('2024-01-20T00:00:00Z');
    expect(result[2].createdAt).toBe('2024-01-10T00:00:00Z');
  });

  it('should sort by status', () => {
    const result = sortSubmittals(mockSubmittals, 'status', 'asc');

    expect(result[0].status).toBe('APPROVED');
    expect(result[1].status).toBe('DRAFT');
    expect(result[2].status).toBe('SUBMITTED');
  });
});

describe('SubmittalsContent - View Mode Logic', () => {
  type ViewMode = 'list' | 'grid';

  interface ViewModeState {
    currentMode: ViewMode;
    itemsPerPage: number;
  }

  function getViewModeSettings(mode: ViewMode): ViewModeState {
    return {
      currentMode: mode,
      itemsPerPage: mode === 'list' ? 25 : 12,
    };
  }

  function toggleViewMode(current: ViewMode): ViewMode {
    return current === 'list' ? 'grid' : 'list';
  }

  it('should return correct settings for list mode', () => {
    const settings = getViewModeSettings('list');

    expect(settings.currentMode).toBe('list');
    expect(settings.itemsPerPage).toBe(25);
  });

  it('should return correct settings for grid mode', () => {
    const settings = getViewModeSettings('grid');

    expect(settings.currentMode).toBe('grid');
    expect(settings.itemsPerPage).toBe(12);
  });

  it('should toggle view mode correctly', () => {
    expect(toggleViewMode('list')).toBe('grid');
    expect(toggleViewMode('grid')).toBe('list');
  });
});

describe('SubmittalsContent - Selection Logic', () => {
  interface SelectionState {
    selectedIds: Set<string>;
    lastSelectedId: string | null;
  }

  function toggleSelection(state: SelectionState, id: string): SelectionState {
    const newSelected = new Set(state.selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    return {
      selectedIds: newSelected,
      lastSelectedId: id,
    };
  }

  function selectAll(ids: string[]): SelectionState {
    return {
      selectedIds: new Set(ids),
      lastSelectedId: ids.length > 0 ? ids[ids.length - 1] : null,
    };
  }

  function clearSelection(): SelectionState {
    return {
      selectedIds: new Set(),
      lastSelectedId: null,
    };
  }

  it('should toggle selection on', () => {
    const initial: SelectionState = { selectedIds: new Set(), lastSelectedId: null };
    const result = toggleSelection(initial, 'item-1');

    expect(result.selectedIds.has('item-1')).toBe(true);
    expect(result.lastSelectedId).toBe('item-1');
  });

  it('should toggle selection off', () => {
    const initial: SelectionState = { selectedIds: new Set(['item-1']), lastSelectedId: 'item-1' };
    const result = toggleSelection(initial, 'item-1');

    expect(result.selectedIds.has('item-1')).toBe(false);
  });

  it('should select all items', () => {
    const ids = ['item-1', 'item-2', 'item-3'];
    const result = selectAll(ids);

    expect(result.selectedIds.size).toBe(3);
    expect(result.selectedIds.has('item-1')).toBe(true);
    expect(result.selectedIds.has('item-2')).toBe(true);
    expect(result.selectedIds.has('item-3')).toBe(true);
  });

  it('should clear selection', () => {
    const result = clearSelection();

    expect(result.selectedIds.size).toBe(0);
    expect(result.lastSelectedId).toBeNull();
  });
});

describe('SubmittalsContent - Pagination Logic', () => {
  interface PaginationState {
    currentPage: number;
    pageSize: number;
    totalItems: number;
  }

  function getTotalPages(state: PaginationState): number {
    return Math.ceil(state.totalItems / state.pageSize);
  }

  function getPageRange(
    state: PaginationState
  ): { start: number; end: number } {
    const start = (state.currentPage - 1) * state.pageSize;
    const end = Math.min(start + state.pageSize, state.totalItems);
    return { start, end };
  }

  function canGoNext(state: PaginationState): boolean {
    return state.currentPage < getTotalPages(state);
  }

  function canGoPrevious(state: PaginationState): boolean {
    return state.currentPage > 1;
  }

  it('should calculate total pages correctly', () => {
    expect(getTotalPages({ currentPage: 1, pageSize: 10, totalItems: 25 })).toBe(3);
    expect(getTotalPages({ currentPage: 1, pageSize: 10, totalItems: 20 })).toBe(2);
    expect(getTotalPages({ currentPage: 1, pageSize: 10, totalItems: 5 })).toBe(1);
    expect(getTotalPages({ currentPage: 1, pageSize: 10, totalItems: 0 })).toBe(0);
  });

  it('should calculate page range correctly', () => {
    const state: PaginationState = { currentPage: 2, pageSize: 10, totalItems: 25 };
    const range = getPageRange(state);

    expect(range.start).toBe(10);
    expect(range.end).toBe(20);
  });

  it('should handle last page correctly', () => {
    const state: PaginationState = { currentPage: 3, pageSize: 10, totalItems: 25 };
    const range = getPageRange(state);

    expect(range.start).toBe(20);
    expect(range.end).toBe(25);
  });

  it('should determine navigation availability', () => {
    const middlePage: PaginationState = { currentPage: 2, pageSize: 10, totalItems: 30 };
    expect(canGoNext(middlePage)).toBe(true);
    expect(canGoPrevious(middlePage)).toBe(true);

    const firstPage: PaginationState = { currentPage: 1, pageSize: 10, totalItems: 30 };
    expect(canGoNext(firstPage)).toBe(true);
    expect(canGoPrevious(firstPage)).toBe(false);

    const lastPage: PaginationState = { currentPage: 3, pageSize: 10, totalItems: 30 };
    expect(canGoNext(lastPage)).toBe(false);
    expect(canGoPrevious(lastPage)).toBe(true);
  });
});

describe('SubmittalsContent - Status Badge Logic', () => {
  type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

  function getStatusBadgeVariant(status: SubmittalStatusGQL): BadgeVariant {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'SUBMITTED':
        return 'info';
      case 'APPROVED':
        return 'success';
      case 'APPROVED_AS_NOTED':
        return 'warning';
      case 'REVISE_AND_RESUBMIT':
        return 'warning';
      case 'REJECTED':
        return 'danger';
      default:
        return 'default';
    }
  }

  it('should return correct badge variants', () => {
    expect(getStatusBadgeVariant('DRAFT')).toBe('default');
    expect(getStatusBadgeVariant('SUBMITTED')).toBe('info');
    expect(getStatusBadgeVariant('APPROVED')).toBe('success');
    expect(getStatusBadgeVariant('APPROVED_AS_NOTED')).toBe('warning');
    expect(getStatusBadgeVariant('REVISE_AND_RESUBMIT')).toBe('warning');
    expect(getStatusBadgeVariant('REJECTED')).toBe('danger');
  });
});
