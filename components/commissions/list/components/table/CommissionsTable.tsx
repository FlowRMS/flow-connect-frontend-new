/**
 * CommissionsTable Component
 * Main table component that assembles header, rows, bulk actions, etc.
 */

import { useRef } from 'react';
import type { CommissionCheck } from '@/lib/types/rms';
import type { CheckStatus } from '@/components/lib/graphql/checks';
import type { SortField, SortDirection } from '../../types';
import type { ActiveFilter } from '@/components/advancedFilters/types';
import { getCommissionFilterOptions } from '../../config/filterConfig';
import { isCheckLinked, getCheckLinkedReason } from '../../utils';
import { BulkActionsBar } from './BulkActionsBar';
import { CommissionsTableHeader } from './CommissionsTableHeader';
import { CommissionRow } from './CommissionRow';
import { CommissionsEmptyState } from './CommissionsEmptyState';
import { CommissionsTableSkeleton } from './CommissionsTableSkeleton';
import { useScrollPagination } from '@/components/hooks/useInfiniteScroll';

interface CommissionsTableProps {
  // Data
  filteredChecks: CommissionCheck[];
  // Loading state
  isLoading?: boolean;
  // Selection (legacy API)
  selectedCheckIds: Set<string>;
  toggleCheckSelection: (checkId: string) => void;
  selectAllChecks: (checks: CommissionCheck[]) => void;
  clearSelection: () => void;
  areAllEligibleSelected: ((checks: CommissionCheck[]) => boolean) | boolean;
  // Selection (new API for proper select all)
  isItemSelected?: (id: string) => boolean;
  isAllSelected?: boolean;
  isPartiallySelected?: boolean;
  handleSelectAll?: (checked: boolean) => void;
  handleSelectOne?: (id: string, checked: boolean) => void;
  // Sorting
  sortField: SortField;
  sortDirection: SortDirection;
  handleSort: (field: SortField) => void;
  // Column filters
  onColumnFiltersChange?: (filters: Record<string, ActiveFilter[]>) => void;
  filterOptions?: ReturnType<typeof getCommissionFilterOptions>;
  columnFilters?: Record<string, ActiveFilter[]>;
  // Bulk actions
  showBulkActionsMenu: boolean;
  setShowBulkActionsMenu: (show: boolean) => void;
  bulkSetStatus: (status: CheckStatus) => void;
  bulkDelete: () => void;
  isBulkUpdating?: boolean;
  // Selected check for preview
  setSelectedCheck: (check: CommissionCheck) => void;
  // Pagination props for infinite scroll
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  // Sorting state for header UI (server-side)
  activeSort?: { columnName: string; direction: 'ASC' | 'DESC' };
  onSortChange?: (columnName: string) => void;
  isFetching?: boolean;
}

export function CommissionsTable({
  filteredChecks,
  isLoading = false,
  selectedCheckIds,
  toggleCheckSelection,
  selectAllChecks,
  clearSelection,
  areAllEligibleSelected,
  isItemSelected,
  isAllSelected,
  isPartiallySelected,
  handleSelectAll,
  handleSelectOne,
  sortField,
  sortDirection,
  handleSort,
  onColumnFiltersChange,
  filterOptions = getCommissionFilterOptions(),
  columnFilters,
  showBulkActionsMenu,
  setShowBulkActionsMenu,
  bulkSetStatus,
  bulkDelete,
  isBulkUpdating = false,
  setSelectedCheck,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  activeSort,
  onSortChange,
  isFetching = false,
}: CommissionsTableProps) {
  // Ref for the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use scroll pagination hook to detect when scrolling near bottom of table
  useScrollPagination(scrollContainerRef, {
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage: isFetchingNextPage ?? false,
    fetchNextPage: fetchNextPage ?? (() => {}),
    threshold: 200, // Trigger when within 200px of bottom
  });

  // Compatibility layer: use new API if available, fall back to legacy
  const checkIsSelected = (id: string) =>
    isItemSelected ? isItemSelected(id) : selectedCheckIds.has(id);
  const allSelected = isAllSelected !== undefined
    ? isAllSelected
    : (typeof areAllEligibleSelected === 'function' ? areAllEligibleSelected(filteredChecks) : areAllEligibleSelected);
  const partiallySelected = isPartiallySelected !== undefined
    ? isPartiallySelected
    : (selectedCheckIds.size > 0 && !allSelected);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
      {filteredChecks.length === 0 && !isLoading ? (
        <CommissionsEmptyState />
      ) : (
        <div className="flex flex-col" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <div 
            ref={scrollContainerRef}
            className="overflow-auto scrollbar-always-visible flex-1"
          >
            <table className="w-full min-w-[1200px]">
              <CommissionsTableHeader
                filteredChecks={filteredChecks}
                areAllEligibleSelected={allSelected}
                isPartiallySelected={partiallySelected}
                onSelectAll={(checked) => {
                  if (handleSelectAll) {
                    handleSelectAll(checked);
                  } else if (checked) {
                    selectAllChecks(filteredChecks);
                  } else {
                    clearSelection();
                  }
                }}
                onColumnFiltersChange={onColumnFiltersChange}
                filterOptions={filterOptions}
                columnFilters={columnFilters}
                activeSort={activeSort}
                onSortChange={onSortChange}
                isFetching={isFetching}
              />
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <CommissionsTableSkeleton rowCount={8} />
                ) : (
                  filteredChecks.map((check) => (
                    <CommissionRow
                      key={check.id}
                      check={check}
                      isSelected={checkIsSelected(check.id)}
                      isLinked={isCheckLinked(check)}
                      linkedReason={getCheckLinkedReason(check)}
                      onToggleSelection={() => {
                        if (handleSelectOne) {
                          handleSelectOne(check.id, !checkIsSelected(check.id));
                        } else {
                          toggleCheckSelection(check.id);
                        }
                      }}
                      onPreview={() => setSelectedCheck(check)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Bulk Actions Bar - shown when items are selected */}
      {selectedCheckIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedCheckIds.size}
          showBulkActionsMenu={showBulkActionsMenu}
          setShowBulkActionsMenu={setShowBulkActionsMenu}
          onClearSelection={clearSelection}
          onBulkSetStatus={bulkSetStatus}
          onBulkDelete={bulkDelete}
          isLoading={isBulkUpdating}
        />
      )}
    </div>
  );
}

