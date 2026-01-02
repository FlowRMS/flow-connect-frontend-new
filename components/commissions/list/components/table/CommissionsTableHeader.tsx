/**
 * CommissionsTableHeader Component
 * Table header with column labels, sorting, and filters
 */

import type { CommissionCheck } from '@/lib/types/rms';
import type { SortField, SortDirection, ColumnFilters } from '../../types';
import { SortIcon } from './SortIcon';
import { ColumnFilterDropdown } from './ColumnFilterDropdown';
import { checkStatusLabels } from '../../constants';

interface CommissionsTableHeaderProps {
  // Selection
  filteredChecks: CommissionCheck[];
  areAllEligibleSelected: boolean;
  onSelectAll: () => void;
  // Sorting
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  // Filters
  columnFilters: ColumnFilters;
  setColumnFilters: (
    filters: ColumnFilters | ((prev: ColumnFilters) => ColumnFilters)
  ) => void;
  openFilter: string | null;
  setOpenFilter: (filterId: string | null) => void;
  // Unique values for dropdowns
  uniqueStatuses: string[];
  uniqueManufacturers: string[];
  // Grid columns
  gridColumns: string;
}

export function CommissionsTableHeader({
  filteredChecks,
  areAllEligibleSelected,
  onSelectAll,
  sortField,
  sortDirection,
  onSort,
  columnFilters,
  setColumnFilters,
  openFilter,
  setOpenFilter,
  uniqueStatuses,
  uniqueManufacturers,
  gridColumns,
}: CommissionsTableHeaderProps) {
  return (
    <div
      className="grid gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30 min-w-[1200px]"
      style={{ gridTemplateColumns: gridColumns }}
    >
      {/* Preview column header - empty */}
      <div className="flex items-center justify-center" />

      {/* Checkbox column */}
      <div className="w-8 flex items-center">
        <input
          type="checkbox"
          checked={areAllEligibleSelected}
          onChange={onSelectAll}
          className="rounded border-[var(--border)] accent-[var(--primary)]"
        />
      </div>

      {/* Check Number */}
      <div className="flex items-center">
        <button
          onClick={() => onSort('checkNumber')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Check Number
          <SortIcon
            field="checkNumber"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
          />
        </button>
        <ColumnFilterDropdown
          type="text"
          filterId="checkNumber"
          value={columnFilters.checkNumber}
          onChange={(value) =>
            setColumnFilters((prev) => ({ ...prev, checkNumber: value }))
          }
          placeholder="Search checks..."
          isOpen={openFilter === 'checkNumber'}
          onToggle={() =>
            setOpenFilter(openFilter === 'checkNumber' ? null : 'checkNumber')
          }
        />
      </div>

      {/* Posted Status */}
      <div className="flex items-center">
        <button
          onClick={() => onSort('status')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Posted Status
          <SortIcon
            field="status"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
          />
        </button>
        <ColumnFilterDropdown
          type="multiselect"
          filterId="status"
          options={uniqueStatuses.map((s) => ({
            value: s,
            label: checkStatusLabels[s as keyof typeof checkStatusLabels],
          }))}
          value={columnFilters.status}
          onChange={(value) =>
            setColumnFilters((prev) => ({ ...prev, status: value }))
          }
          placeholder="All Statuses"
          isOpen={openFilter === 'status'}
          onToggle={() =>
            setOpenFilter(openFilter === 'status' ? null : 'status')
          }
        />
      </div>

      {/* Commission */}
      <div className="flex items-center">
        <button
          onClick={() => onSort('netAmount')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Commission
          <SortIcon
            field="netAmount"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
          />
        </button>
      </div>

      {/* Commission Month */}
      <div className="flex items-center">
        <button
          onClick={() => onSort('commissionMonth')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Commission Month
          <SortIcon
            field="commissionMonth"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
          />
        </button>
        <ColumnFilterDropdown
          type="daterange"
          filterId="commissionMonth"
          value={columnFilters.commissionMonth}
          onChange={(value) =>
            setColumnFilters((prev) => ({ ...prev, commissionMonth: value }))
          }
          isOpen={openFilter === 'commissionMonth'}
          onToggle={() =>
            setOpenFilter(
              openFilter === 'commissionMonth' ? null : 'commissionMonth'
            )
          }
        />
      </div>

      {/* Factory */}
      <div className="flex items-center">
        <button
          onClick={() => onSort('manufacturerName')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Factory
          <SortIcon
            field="manufacturerName"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
          />
        </button>
        <ColumnFilterDropdown
          type="multiselect"
          filterId="manufacturerName"
          options={uniqueManufacturers.map((m) => ({
            value: m,
            label: m,
          }))}
          value={columnFilters.manufacturerName}
          onChange={(value) =>
            setColumnFilters((prev) => ({ ...prev, manufacturerName: value }))
          }
          placeholder="All Factories"
          isOpen={openFilter === 'manufacturerName'}
          onToggle={() =>
            setOpenFilter(
              openFilter === 'manufacturerName' ? null : 'manufacturerName'
            )
          }
        />
      </div>

      {/* Post Date */}
      <div className="flex items-center">
        <button
          onClick={() => onSort('postDate')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Post Date
          <SortIcon
            field="postDate"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
          />
        </button>
        <ColumnFilterDropdown
          type="daterange"
          filterId="postDate"
          value={columnFilters.postDate}
          onChange={(value) =>
            setColumnFilters((prev) => ({ ...prev, postDate: value }))
          }
          isOpen={openFilter === 'postDate'}
          onToggle={() =>
            setOpenFilter(openFilter === 'postDate' ? null : 'postDate')
          }
        />
      </div>

      {/* Check Date */}
      <div className="flex items-center">
        <button
          onClick={() => onSort('checkDate')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Check Date
          <SortIcon
            field="checkDate"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
          />
        </button>
        <ColumnFilterDropdown
          type="daterange"
          filterId="checkDate"
          value={columnFilters.checkDate}
          onChange={(value) =>
            setColumnFilters((prev) => ({ ...prev, checkDate: value }))
          }
          isOpen={openFilter === 'checkDate'}
          onToggle={() =>
            setOpenFilter(openFilter === 'checkDate' ? null : 'checkDate')
          }
        />
      </div>

      {/* Entry Date */}
      <div className="flex items-center">
        <button
          onClick={() => onSort('entryDate')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Entry Date
          <SortIcon
            field="entryDate"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
          />
        </button>
        <ColumnFilterDropdown
          type="daterange"
          filterId="entryDate"
          value={columnFilters.entryDate}
          onChange={(value) =>
            setColumnFilters((prev) => ({ ...prev, entryDate: value }))
          }
          isOpen={openFilter === 'entryDate'}
          onToggle={() =>
            setOpenFilter(openFilter === 'entryDate' ? null : 'entryDate')
          }
        />
      </div>

      {/* Created By */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Created By
        </span>
      </div>

      {/* Check Balance */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => onSort('checkBalance')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Check Balance
          <SortIcon
            field="checkBalance"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
          />
        </button>
      </div>
    </div>
  );
}

