/**
 * CommissionsTableHeader Component
 * Table header with column labels, sorting, and filters
 */

'use client';

import React, { useState, useCallback } from 'react';
import type { CommissionCheck } from '@/lib/types/rms';
import { ColumnFilter } from '@/components/advancedFilters/components/ColumnFilter';
import type { ActiveFilter } from '@/components/advancedFilters/types';
import { getCommissionFilterOptions } from '../../config/filterConfig';
import { SortIndicator } from '@/components/shared/sorting/components/SortIndicator';
import type { ActiveSort } from '@/components/shared/sorting/types';

interface CommissionsTableHeaderProps {
  // Selection
  filteredChecks: CommissionCheck[];
  areAllEligibleSelected: boolean;
  isPartiallySelected?: boolean;
  onSelectAll: (checked: boolean) => void;
  // Column filters
  onColumnFiltersChange?: (filters: Record<string, ActiveFilter[]>) => void;
  filterOptions?: ReturnType<typeof getCommissionFilterOptions>;
  columnFilters?: Record<string, ActiveFilter[]>;
  // Sorting (single-column, server-side)
  activeSort?: { columnName: string; direction: 'ASC' | 'DESC' };
  onSortChange?: (columnName: string) => void;
  isFetching?: boolean;
}

export function CommissionsTableHeader({
  filteredChecks,
  areAllEligibleSelected,
  isPartiallySelected = false,
  onSelectAll,
  onColumnFiltersChange,
  filterOptions = getCommissionFilterOptions(),
  columnFilters: parentColumnFilters,
  activeSort,
  onSortChange,
  isFetching = false,
}: CommissionsTableHeaderProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  
  // Column filter state - use parent if provided, otherwise local state
  const [localColumnFilters, setLocalColumnFilters] = useState<Record<string, ActiveFilter[]>>({});
  const columnFilters = parentColumnFilters !== undefined ? parentColumnFilters : localColumnFilters;
  
  // Helper to get active sort for a specific API column
  const getActiveSortForColumn = useCallback((columnName: string): ActiveSort | null => {
    if (!activeSort || activeSort.columnName !== columnName) return null;
    return {
      columnId: columnName,
      direction: activeSort.direction,
    };
  }, [activeSort]);
  
  // Map from UI column keys to filter option IDs
  const columnKeyToFilterId: Record<string, string> = {
    checkNumber: 'check-number',
    status: 'status',
    commissionMonth: 'commission-month',
    postDate: 'post-date',
    checkDate: 'check-date',
    entryDate: 'entry-date',
    netAmount: 'net-amount',
    manufacturerName: 'factory-name',
  };
  
  // Handle column filter change - now receives ActiveFilter[]
  const handleColumnFilterChange = useCallback((columnKey: string, filters: ActiveFilter[]) => {
    // Calculate new filters
    const newFilters = { ...columnFilters };
    
    // Remove filter if empty array
    if (filters.length === 0) {
      delete newFilters[columnKey];
    } else {
      newFilters[columnKey] = filters;
    }
    
    // Update local state if using local state
    if (parentColumnFilters === undefined) {
      setLocalColumnFilters(newFilters);
    }
    
    // Call the parent callback if provided
    if (onColumnFiltersChange) {
      onColumnFiltersChange(newFilters);
    }
  }, [columnFilters, parentColumnFilters, onColumnFiltersChange]);

  // Render column filter component
  const renderColumnFilter = (columnKey: string) => {
    const filterId = columnKeyToFilterId[columnKey];
    if (!filterId) {
      return null;
    }
    
    const filterOption = filterOptions.find(f => f.id === filterId);
    if (!filterOption || !filterOption.columnName) {
      return null;
    }
    
    // Ensure type is preserved correctly
    const filterType = filterOption.type as 'text' | 'dropdown' | 'number' | 'date' | 'boolean' | 'month';
    
    // Get filters for this column (ActiveFilter[])
    const columnFiltersForThisColumn = columnFilters[columnKey] || [];
    
    return (
      <ColumnFilter
        type={filterType}
        columnName={filterOption.columnName}
        value={columnFiltersForThisColumn}
        onChange={(filters) => handleColumnFilterChange(columnKey, filters)}
        options={filterOption.options}
        placeholder={filterOption.type === 'text' || filterOption.type === 'number' 
          ? `Filter ${filterOption.label.toLowerCase()}...` 
          : undefined}
        isOpen={openFilter === columnKey}
        onToggle={() => setOpenFilter(openFilter === columnKey ? null : columnKey)}
        filterOption={filterOption}
      />
    );
  };
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
            <span
              className="whitespace-nowrap cursor-pointer hover:text-gray-700"
              onClick={() => onSortChange?.('checkNumber')}
            >
              Check Number
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('checkNumber')}
            </div>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator
                  columnId="checkNumber"
                  activeSort={getActiveSortForColumn('checkNumber')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>

        {/* Posted Status */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center gap-1.5">
            <span
              className="whitespace-nowrap cursor-pointer hover:text-gray-700"
              onClick={() => onSortChange?.('status')}
            >
              Posted Status
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('status')}
            </div>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator
                  columnId="status"
                  activeSort={getActiveSortForColumn('status')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>

        {/* Commission */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
          <div className="flex items-center gap-1.5 justify-end">
            <span
              className="whitespace-nowrap cursor-pointer hover:text-gray-700"
              onClick={() => onSortChange?.('enteredCommissionAmount')}
            >
              Commission
            </span>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator
                  columnId="enteredCommissionAmount"
                  activeSort={getActiveSortForColumn('enteredCommissionAmount')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>

        {/* Commission Month */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '150px' }}>
          <div className="flex items-center gap-1.5">
            <span
              className="whitespace-nowrap cursor-pointer hover:text-gray-700"
              onClick={() => onSortChange?.('commissionMonth')}
            >
              Commission Month
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('commissionMonth')}
            </div>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator
                  columnId="commissionMonth"
                  activeSort={getActiveSortForColumn('commissionMonth')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>

        {/* Factory */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '140px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Factory</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('manufacturerName')}
            </div>
          </div>
        </th>

        {/* Post Date */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center gap-1.5">
            <span
              className="whitespace-nowrap cursor-pointer hover:text-gray-700"
              onClick={() => onSortChange?.('postDate')}
            >
              Post Date
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('postDate')}
            </div>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator
                  columnId="postDate"
                  activeSort={getActiveSortForColumn('postDate')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>

        {/* Check Date */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center gap-1.5">
            <span
              className="whitespace-nowrap cursor-pointer hover:text-gray-700"
              onClick={() => onSortChange?.('checkDate')}
            >
              Check Date
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('checkDate')}
            </div>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator
                  columnId="checkDate"
                  activeSort={getActiveSortForColumn('checkDate')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>

        {/* Entry Date */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center gap-1.5">
            <span
              className="whitespace-nowrap cursor-pointer hover:text-gray-700"
              onClick={() => onSortChange?.('createdAt')}
            >
              Entry Date
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('entryDate')}
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

