/**
 * OrdersTableHeader Component
 * Table header with column labels, sorting, and filters
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type { Order } from '@/lib/types/rms';
import { ColumnFilter } from '@/components/advancedFilters/components/ColumnFilter';
import type { ActiveFilter, ColumnFilterType } from '@/components/advancedFilters/types';
import { getOrderFilterOptions } from '../../config/filterConfig';
import { SortIndicator } from '@/components/shared/sorting/components/SortIndicator';
import type { ActiveSort } from '@/components/shared/sorting/types';

interface OrdersTableHeaderProps {
  // Selection
  filteredOrders: Order[];
  areAllEligibleSelected: boolean;
  onSelectAll: () => void;
  // Column filters
  onColumnFiltersChange?: (filters: Record<string, ActiveFilter[]>) => void;
  filterOptions?: ReturnType<typeof getOrderFilterOptions>;
  columnFilters?: Record<string, ActiveFilter[]>;
  // Sorting props
  activeSorts?: Array<{ columnName: string; direction: 'ASC' | 'DESC' }>;
  onSortChange?: (columnName: string) => void;
  isFetching?: boolean;
}

export function OrdersTableHeader({
  filteredOrders,
  areAllEligibleSelected,
  onSelectAll,
  onColumnFiltersChange,
  filterOptions = getOrderFilterOptions([], []),
  columnFilters: parentColumnFilters,
  activeSorts = [],
  onSortChange,
  isFetching = false,
}: OrdersTableHeaderProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  
  // Helper to get active sort for a specific column
  const getActiveSortForColumn = useCallback((columnName: string): ActiveSort | null => {
    const sort = activeSorts.find(s => s.columnName === columnName);
    if (!sort) return null;
    return {
      columnId: columnName, // Use columnName as columnId for SortIndicator
      direction: sort.direction,
    };
  }, [activeSorts]);
  
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
    orderType: 'order-type',
    total: 'total',
    commission: 'commission',
    orderDate: 'order-date',
    entryDate: 'created-date',
    jobName: 'job-name',
    visible: 'published', // Column is 'visible' but filter ID is 'published'
    factoryName: 'factory-name',
    createdBy: 'created-by',
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
    
    const filterType = filterOption.type as ColumnFilterType;
    
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
        picklistKey={filterOption.picklistKey}
        multiSelect={filterOption.multiSelect}
      />
    );
  };
  
  return (
    <thead className="bg-gray-50 border-b-2 border-gray-300 sticky top-0 z-10 shadow-sm">
      <tr>
        {/* Checkbox */}
        <th className="w-10 px-3 py-3 text-left">
          <input
            type="checkbox"
            checked={areAllEligibleSelected}
            onChange={onSelectAll}
            className="w-4 h-4 rounded border-gray-300 accent-indigo-600"
          />
        </th>
        
        {/* Preview */}
        <th className="w-10 px-3 py-3 text-center"></th>
        
        {/* Order # */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '140px' }}>
          <div className="flex items-center gap-1.5">
            <span 
              className="cursor-pointer hover:text-gray-700 whitespace-nowrap" 
              onClick={() => onSortChange?.('orderNumber')}
            >
              Order #
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('orderNumber')}
            </div>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator 
                  columnId="orderNumber" 
                  activeSort={getActiveSortForColumn('orderNumber')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>
        
        {/* Commission */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '140px' }}>
          <div className="flex items-center justify-end gap-1.5">
            <span 
              className="cursor-pointer hover:text-gray-700 whitespace-nowrap" 
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
        
        {/* Status */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center gap-1.5">
            <span 
              className="cursor-pointer hover:text-gray-700 whitespace-nowrap" 
              onClick={() => onSortChange?.('status')}
            >
              Status
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
        
        {/* Order Type */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Order Type</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('orderType')}
            </div>
          </div>
        </th>
        
        {/* Amount */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
          <div className="flex items-center justify-end gap-1.5">
            <span 
              className="cursor-pointer hover:text-gray-700 whitespace-nowrap" 
              onClick={() => onSortChange?.('total')}
            >
              Amount
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
        
        {/* Order Date */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center gap-1.5">
            <span 
              className="cursor-pointer hover:text-gray-700 whitespace-nowrap" 
              onClick={() => onSortChange?.('entityDate')}
            >
              Order Date
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('orderDate')}
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
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Entry Date</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('entryDate')}
            </div>
          </div>
        </th>
        
        {/* Created By */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '140px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Created By</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('createdBy')}
            </div>
          </div>
        </th>
        
        {/* Ship Date */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '90px' }}>
          <span className="whitespace-nowrap">Ship Date</span>
        </th>
        
        {/* Due Date */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '90px' }}>
          <span className="whitespace-nowrap">Due Date</span>
        </th>
        
        {/* Factory */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '140px' }}>
          <div className="flex items-center gap-1.5">
            <span 
              className="cursor-pointer hover:text-gray-700 whitespace-nowrap" 
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
        
        {/* Customer */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '140px' }}>
          <div className="flex items-center gap-1.5">
            <span 
              className="cursor-pointer hover:text-gray-700 whitespace-nowrap" 
              onClick={() => onSortChange?.('soldToCustomerName')}
            >
              Customer
            </span>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator 
                  columnId="soldToCustomerName" 
                  activeSort={getActiveSortForColumn('soldToCustomerName')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>
        
        {/* Job Name */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '180px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Job Name</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('jobName')}
            </div>
          </div>
        </th>
        
        {/* Visible */}
        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '80px' }}>
          <div className="flex items-center justify-center gap-1.5">
            <span className="whitespace-nowrap">Visible</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('visible')}
            </div>
          </div>
        </th>
      </tr>
    </thead>
  );
}
