/**
 * CommissionsTable Component
 * Main table component that assembles header, rows, bulk actions, etc.
 */

import type { CommissionCheck } from '@/lib/types/rms';
import type { CheckStatus } from '@/components/lib/graphql/checks';
import type { SortField, SortDirection, ColumnFilters } from '../../types';
import { getGridTemplateColumns } from '../../config/columnConfig';
import { isCheckLinked, getCheckLinkedReason } from '../../utils';
import { BulkActionsBar } from './BulkActionsBar';
import { CommissionsTableHeader } from './CommissionsTableHeader';
import { CommissionRow } from './CommissionRow';
import { CommissionsEmptyState } from './CommissionsEmptyState';

interface CommissionsTableProps {
  // Data
  filteredChecks: CommissionCheck[];
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
  // Filters
  columnFilters: ColumnFilters;
  setColumnFilters: (
    filters: ColumnFilters | ((prev: ColumnFilters) => ColumnFilters)
  ) => void;
  openFilter: string | null;
  setOpenFilter: (filterId: string | null) => void;
  uniqueStatuses: string[];
  uniqueManufacturers: string[];
  // Bulk actions
  showBulkActionsMenu: boolean;
  setShowBulkActionsMenu: (show: boolean) => void;
  bulkSetStatus: (status: CheckStatus) => void;
  bulkDelete: () => void;
  isBulkUpdating?: boolean;
  // Selected check for preview
  setSelectedCheck: (check: CommissionCheck) => void;
}

export function CommissionsTable({
  filteredChecks,
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
  columnFilters,
  setColumnFilters,
  openFilter,
  setOpenFilter,
  uniqueStatuses,
  uniqueManufacturers,
  showBulkActionsMenu,
  setShowBulkActionsMenu,
  bulkSetStatus,
  bulkDelete,
  isBulkUpdating = false,
  setSelectedCheck,
}: CommissionsTableProps) {
  const gridColumns = getGridTemplateColumns();

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
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
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

      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Table Header */}
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
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            columnFilters={columnFilters}
            setColumnFilters={setColumnFilters}
            openFilter={openFilter}
            setOpenFilter={setOpenFilter}
            uniqueStatuses={uniqueStatuses}
            uniqueManufacturers={uniqueManufacturers}
            gridColumns={gridColumns}
          />

          {/* Table Body */}
          <div className="divide-y divide-[var(--border)]">
            {filteredChecks.length === 0 ? (
              <CommissionsEmptyState />
            ) : (
              filteredChecks.map((check) => (
                <CommissionRow
                  key={check.id}
                  check={check}
                  isSelected={selectedCheckIds.has(check.id)}
                  isLinked={isCheckLinked(check)}
                  linkedReason={getCheckLinkedReason(check)}
                  onToggleSelection={() => toggleCheckSelection(check.id)}
                  onPreview={() => setSelectedCheck(check)}
                  gridColumns={gridColumns}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

