/**
 * CommissionsTableHeader Component
 * Table header with column labels, sorting, and filters
 */

import type { CommissionCheck } from '@/lib/types/rms';
import type { SortField, SortDirection, ColumnFilters } from '../../types';
import { ColumnFilterDropdown } from './ColumnFilterDropdown';
import { checkStatusLabels } from '../../constants';

interface CommissionsTableHeaderProps {
  // Selection
  filteredChecks: CommissionCheck[];
  areAllEligibleSelected: boolean;
  isPartiallySelected?: boolean;
  onSelectAll: (checked: boolean) => void;
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
}

export function CommissionsTableHeader({
  filteredChecks,
  areAllEligibleSelected,
  isPartiallySelected = false,
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
}: CommissionsTableHeaderProps) {
  return (
    <thead className="bg-gray-50 border-b-2 border-gray-300 sticky top-0 z-10 shadow-sm">
      <tr>
        {/* Preview column header */}
        <th className="w-10 px-3 py-3 text-center"></th>

        {/* Checkbox column */}
        <th className="w-10 px-3 py-3 text-left">
          <input
            type="checkbox"
            checked={areAllEligibleSelected}
            ref={(el) => {
              if (el) el.indeterminate = isPartiallySelected;
            }}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 accent-indigo-600"
          />
        </th>

        {/* Check Number */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Check Number</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </th>

        {/* Posted Status */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Posted Status</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </th>

        {/* Commission */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
          <span className="whitespace-nowrap">Commission</span>
        </th>

        {/* Commission Month */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '150px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Commission Month</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </th>

        {/* Factory */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '140px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Factory</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </th>

        {/* Post Date */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Post Date</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </th>

        {/* Check Date */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Check Date</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </th>

        {/* Entry Date */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Entry Date</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </th>

        {/* Created By */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '140px' }}>
          <span className="whitespace-nowrap">Created By</span>
        </th>

        {/* Check Balance */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
          <div className="flex items-center justify-end gap-1.5">
            <span className="whitespace-nowrap">Check Balance</span>
          </div>
        </th>
      </tr>
    </thead>
  );
}

