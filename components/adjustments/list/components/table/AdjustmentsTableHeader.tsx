/**
 * AdjustmentsTableHeader Component
 * Header row for the adjustments table with column filters
 */

'use client';

import React, { useState, useCallback } from 'react';
import { ColumnFilter } from '@/components/advancedFilters/components/ColumnFilter';
import type { ActiveFilter } from '@/components/advancedFilters/types';
import { getAdjustmentFilterOptions } from '../../config/filterConfig';

interface AdjustmentsTableHeaderProps {
  // Column filters
  onColumnFiltersChange?: (filters: Record<string, ActiveFilter[]>) => void;
  filterOptions?: ReturnType<typeof getAdjustmentFilterOptions>;
  columnFilters?: Record<string, ActiveFilter[]>;
}

export function AdjustmentsTableHeader({
  onColumnFiltersChange,
  filterOptions = getAdjustmentFilterOptions(),
  columnFilters: parentColumnFilters,
}: AdjustmentsTableHeaderProps) {
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
  
  // Map from UI column keys to filter option IDs
  const columnKeyToFilterId: Record<string, string> = {
    adjustmentNumber: 'adjustment-number',
    entityDate: 'adjustment-date',
    amount: 'amount',
    status: 'status',
    locked: 'locked',
  };
  
  // Handle column filter change
  const handleColumnFilterChange = useCallback((columnKey: string, filters: ActiveFilter[]) => {
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
  }, [columnFilters, parentColumnFilters, onColumnFiltersChange, setColumnFilters]);

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
    const filterType = filterOption.type as 'text' | 'dropdown' | 'number' | 'date' | 'boolean';
    
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

  const handleSort = (field: 'date' | 'amount' | 'number') => {
    if (onSort) {
      onSort(field);
    }
  };

  return (
    <thead className="bg-white border-b-2 border-[var(--border)] sticky top-0 z-10 shadow-sm">
      <tr>
        <th
          className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs"
          style={{ minWidth: '180px' }}
        >
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Adjustment #</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('adjustmentNumber')}
            </div>
          </div>
        </th>
        <th
          className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs"
          style={{ minWidth: '130px' }}
        >
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Date</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('entityDate')}
            </div>
          </div>
        </th>
        <th 
          className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs"
          style={{ minWidth: '250px' }}
        >
          Reason
        </th>
        <th
          className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs"
          style={{ minWidth: '120px' }}
        >
          <div className="flex items-center justify-end gap-1.5">
            <span className="whitespace-nowrap">Amount</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('amount')}
            </div>
          </div>
        </th>
        <th 
          className="text-center px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs"
          style={{ minWidth: '130px' }}
        >
          <div className="flex items-center justify-center gap-1.5">
            <span className="whitespace-nowrap">Status</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('status')}
            </div>
          </div>
        </th>
        <th 
          className="text-center px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs"
          style={{ minWidth: '100px' }}
        >
          <div className="flex items-center justify-center gap-1.5">
            <span className="whitespace-nowrap">Locked</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('locked')}
            </div>
          </div>
        </th>
        <th 
          className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs"
          style={{ minWidth: '120px' }}
        >
          Created By
        </th>
        <th 
          className="text-center px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs"
          style={{ minWidth: '120px' }}
        >
          Actions
        </th>
      </tr>
    </thead>
  );
}
