'use client';

import React, { useState, useCallback } from 'react';
import { ColumnFilter } from '@/components/advancedFilters/components/ColumnFilter';
import type { ActiveFilter } from '@/components/advancedFilters/types';
import { ColumnFilterTypeEnum } from '@/components/advancedFilters/types';
import { SortIndicator } from '@/components/shared/sorting/components/SortIndicator';
import type { ActiveSort } from '@/components/shared/sorting/types';
import { getStatementFilterOptions, columnKeyToFilterId } from '../../config/filterConfig';

interface StatementsTableHeaderProps {
  // Selection
  areAllEligibleSelected: boolean;
  isPartiallySelected?: boolean;
  onSelectAll: (checked: boolean) => void;
  // Column filters
  onColumnFiltersChange?: (filters: Record<string, ActiveFilter[]>) => void;
  filterOptions?: ReturnType<typeof getStatementFilterOptions>;
  columnFilters?: Record<string, ActiveFilter[]>;
  // Sorting
  activeSort?: { columnName: string; direction: 'ASC' | 'DESC' };
  onSortChange?: (columnName: string) => void;
  isFetching?: boolean;
}

export function StatementsTableHeader({
  areAllEligibleSelected,
  isPartiallySelected,
  onSelectAll,
  onColumnFiltersChange,
  filterOptions = getStatementFilterOptions(),
  columnFilters: parentColumnFilters,
  activeSort,
  onSortChange,
  isFetching = false,
}: StatementsTableHeaderProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  // Column filter state - use parent if provided, otherwise local state
  const [localColumnFilters, setLocalColumnFilters] = useState<Record<string, ActiveFilter[]>>({});
  const columnFilters = parentColumnFilters !== undefined ? parentColumnFilters : localColumnFilters;

  const setColumnFilters = parentColumnFilters !== undefined
    ? (filters: Record<string, ActiveFilter[]>) => {
        if (onColumnFiltersChange) {
          onColumnFiltersChange(filters);
        }
      }
    : setLocalColumnFilters;

  // Helper to get active sort for a specific column
  const getActiveSortForColumn = useCallback(
    (columnName: string): ActiveSort | null => {
      if (!activeSort || activeSort.columnName !== columnName) return null;
      return {
        columnId: columnName,
        direction: activeSort.direction,
      };
    },
    [activeSort]
  );

  // Handle column filter change
  const handleColumnFilterChange = useCallback(
    (columnKey: string, filters: ActiveFilter[]) => {
      const currentFilters = parentColumnFilters !== undefined ? parentColumnFilters : columnFilters;
      const newFilters = { ...currentFilters };

      // Remove filter if empty array
      if (filters.length === 0) {
        delete newFilters[columnKey];
      } else {
        newFilters[columnKey] = filters;
      }

      setColumnFilters(newFilters);
      if (onColumnFiltersChange) {
        onColumnFiltersChange(newFilters);
      }
    },
    [columnFilters, parentColumnFilters, onColumnFiltersChange, setColumnFilters]
  );

  // Render column filter component
  const renderColumnFilter = (columnKey: string) => {
    const filterId = columnKeyToFilterId[columnKey];
    if (!filterId) return null;

    const filterOption = filterOptions.find((f) => f.id === filterId);
    if (!filterOption || !filterOption.columnName) return null;

    const columnFiltersForThisColumn = columnFilters[columnKey] || [];

    return (
      <ColumnFilter
        type={filterOption.type as ColumnFilterTypeEnum}
        columnName={filterOption.columnName}
        value={columnFiltersForThisColumn}
        onChange={(filters) => handleColumnFilterChange(columnKey, filters)}
        options={filterOption.options}
        placeholder={
          filterOption.type === ColumnFilterTypeEnum.text ||
          filterOption.type === ColumnFilterTypeEnum.number
            ? `Filter ${filterOption.label.toLowerCase()}...`
            : undefined
        }
        isOpen={openFilter === columnKey}
        onToggle={() => setOpenFilter(openFilter === columnKey ? null : columnKey)}
        filterOption={filterOption}
      />
    );
  };

  return (
    <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-10 shadow-sm">
      <tr>
        {/* Checkbox */}
        <th className="w-10 px-3 py-3 text-left">
          <input
            type="checkbox"
            checked={areAllEligibleSelected}
            ref={(el) => {
              if (el) el.indeterminate = isPartiallySelected ?? false;
            }}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 accent-emerald-600"
          />
        </th>

        {/* Statement # */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '140px' }}>
          <div className="flex items-center gap-1.5">
            <span
              className="whitespace-nowrap cursor-pointer hover:text-gray-700"
              onClick={() => onSortChange?.('statementNumber')}
            >
              Statement #
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('statementNumber')}
            </div>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator
                  columnId="statementNumber"
                  activeSort={getActiveSortForColumn('statementNumber')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>

        {/* Factory */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '160px' }}>
          <div className="flex items-center gap-1.5">
            <span
              className="whitespace-nowrap cursor-pointer hover:text-gray-700"
              onClick={() => onSortChange?.('factoryName')}
            >
              Factory
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('factoryName')}
            </div>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator
                  columnId="factoryName"
                  activeSort={getActiveSortForColumn('factoryName')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>

        {/* Statement Date */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '150px' }}>
          <div className="flex items-center gap-1.5">
            <span
              className="whitespace-nowrap cursor-pointer hover:text-gray-700"
              onClick={() => onSortChange?.('entityDate')}
            >
              Statement Date
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('entityDate')}
            </div>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator
                  columnId="entityDate"
                  activeSort={getActiveSortForColumn('entityDate')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>

        {/* Entry Date */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '150px' }}>
          <div className="flex items-center gap-1.5">
            <span
              className="whitespace-nowrap cursor-pointer hover:text-gray-700"
              onClick={() => onSortChange?.('createdAt')}
            >
              Entry Date
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('createdAt')}
            </div>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator
                  columnId="createdAt"
                  activeSort={getActiveSortForColumn('createdAt')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>

        {/* Total */}
        <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
          <div className="flex items-center justify-end gap-1.5">
            <span
              className="whitespace-nowrap cursor-pointer hover:text-gray-700"
              onClick={() => onSortChange?.('total')}
            >
              Total
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('total')}
            </div>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator
                  columnId="total"
                  activeSort={getActiveSortForColumn('total')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>

        {/* Commission */}
        <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center justify-end gap-1.5">
            <span
              className="whitespace-nowrap cursor-pointer hover:text-gray-700"
              onClick={() => onSortChange?.('commission')}
            >
              Commission
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('commission')}
            </div>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator
                  columnId="commission"
                  activeSort={getActiveSortForColumn('commission')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>

        {/* Created By */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '150px' }}>
          <span className="whitespace-nowrap">
            Created By
          </span>
        </th>

        {/* Actions */}
        <th className="w-20 px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
  );
}

