/**
 * OrdersTableHeader Component
 * Table header with column labels, sorting, and filters
 */

'use client';

import React, { useState, useCallback } from 'react';
import type { Order } from '@/lib/types/rms';
import { ColumnFilter } from '@/components/advancedFilters/components/ColumnFilter';
import type { ActiveFilter } from '@/components/advancedFilters/types';
import { getOrderFilterOptions } from '../../config/filterConfig';

interface OrdersTableHeaderProps {
  // Selection
  filteredOrders: Order[];
  areAllEligibleSelected: boolean;
  onSelectAll: () => void;
  // Grid columns
  gridColumns: string;
  // Column filters
  onColumnFiltersChange?: (filters: Record<string, ActiveFilter[]>) => void;
  filterOptions?: ReturnType<typeof getOrderFilterOptions>;
  columnFilters?: Record<string, ActiveFilter[]>;
}

export function OrdersTableHeader({
  filteredOrders,
  areAllEligibleSelected,
  onSelectAll,
  gridColumns,
  onColumnFiltersChange,
  filterOptions = getOrderFilterOptions([], []),
  columnFilters: parentColumnFilters,
}: OrdersTableHeaderProps) {
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
    orderNumber: 'order-number',
    status: 'status',
    total: 'total',
    commission: 'commission',
    orderDate: 'order-date',
    entryDate: 'created-date',
    jobName: 'job-name',
    published: 'published',
  };
  
  // Handle column filter change - now receives ActiveFilter[]
  const handleColumnFilterChange = useCallback((columnKey: string, filters: ActiveFilter[]) => {
    // Always use the current columnFilters value (from props if parent provided, otherwise local state)
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
  return (
    <div
      className="grid gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30 sticky top-0"
      style={{ gridTemplateColumns: gridColumns }}
    >
      {/* Checkbox column */}
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          checked={areAllEligibleSelected}
          onChange={onSelectAll}
          className="w-4 h-4 accent-[var(--primary)]"
        />
      </div>

      {/* Preview column header - empty */}
      <div className="flex items-center justify-center" />

      {/* Order # */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Order #
        </span>
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {renderColumnFilter('orderNumber')}
        </div>
      </div>

      {/* Commission */}
      <div className="flex items-center justify-end gap-1.5">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Commission
        </span>
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {renderColumnFilter('commission')}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Status
        </span>
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {renderColumnFilter('status')}
        </div>
      </div>

      {/* Amount */}
      <div className="flex items-center justify-end gap-1.5">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Amount
        </span>
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {renderColumnFilter('total')}
        </div>
      </div>

      {/* Order Date */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Order Date
        </span>
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {renderColumnFilter('orderDate')}
        </div>
      </div>

      {/* Entry Date */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Entry Date
        </span>
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {renderColumnFilter('entryDate')}
        </div>
      </div>

      {/* Created By */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Created By
        </span>
      </div>

      {/* Ship Date */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Ship Date
        </span>
      </div>

      {/* Due Date */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Due Date
        </span>
      </div>

      {/* Factory */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Factory
        </span>
      </div>

      {/* Customer */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Customer
        </span>
      </div>

      {/* Job Name */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Job Name
        </span>
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {renderColumnFilter('jobName')}
        </div>
      </div>

      {/* Visible */}
      <div className="flex items-center justify-center gap-1.5">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Visible
        </span>
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {renderColumnFilter('published')}
        </div>
      </div>
    </div>
  );
}
