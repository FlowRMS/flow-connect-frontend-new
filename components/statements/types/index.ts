/**
 * Statement Types
 * Type definitions specific to the statements UI components
 */

import type { ExportType } from '@/components/shared/excel-export/types';

export type QuickDatePreset = 'all' | 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter' | 'thisYear' | 'lastYear';

export type QuickDateField = 'entityDate' | 'createdAt';

export type SortField = 'statementNumber' | 'factoryName' | 'entityDate' | 'total' | 'commission' | 'createdAt';

export type SortDirection = 'asc' | 'desc';

// Column configuration for table and Excel export
export interface ColumnConfig {
  id: string;
  width: string;
  label: string;
  sortable: boolean;
  filterable: boolean;
  align?: 'left' | 'center' | 'right';
  exportType?: ExportType;
  apiField?: string;
}

export interface StatementListItem {
  id: string;
  statementNumber: string;
  entityDate: string;
  factoryId: string;
  factoryName: string;
  total: number;
  commission: number;
  createdAt: string;
  createdBy: string;
  userIds?: string[];
}

export interface StatementListState {
  // Data
  statements: StatementListItem[];
  selectedStatement: StatementListItem | null;
  totalCount: number;

  // Loading states
  isLoading: boolean;
  isSearching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;

  // Search
  searchQuery: string;

  // Filters
  quickDatePreset: QuickDatePreset;
  quickDateField: QuickDateField;

  // Sort
  sortField: SortField;
  sortDirection: SortDirection;

  // Selection
  selectedIds: Set<string>;
}
