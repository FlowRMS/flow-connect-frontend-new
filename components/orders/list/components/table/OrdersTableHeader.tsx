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
  // Column filters
  onColumnFiltersChange?: (filters: Record<string, ActiveFilter[]>) => void;
  filterOptions?: ReturnType<typeof getOrderFilterOptions>;
  columnFilters?: Record<string, ActiveFilter[]>;
}

export function OrdersTableHeader({
  filteredOrders,
  areAllEligibleSelected,
  onSelectAll,
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
    visible: 'published', // Column is 'visible' but filter ID is 'published'
    factoryName: 'factory-name',
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
    const filterType = filterOption.type as 'text' | 'dropdown' | 'number' | 'date' | 'boolean' | 'factory';
    
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
            <span className="whitespace-nowrap">Order #</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('orderNumber')}
            </div>
          </div>
        </th>
        
        {/* Commission */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '140px' }}>
          <div className="flex items-center justify-end gap-1.5">
            <span className="whitespace-nowrap">Commission</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('commission')}
            </div>
          </div>
        </th>
        
        {/* Status */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Status</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('status')}
            </div>
          </div>
        </th>
        
        {/* Amount */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
          <div className="flex items-center justify-end gap-1.5">
            <span className="whitespace-nowrap">Amount</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('total')}
            </div>
          </div>
        </th>
        
        {/* Order Date */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Order Date</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('orderDate')}
            </div>
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
          <span className="whitespace-nowrap">Created By</span>
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
            <span className="whitespace-nowrap">Factory</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('factoryName')}
            </div>
          </div>
        </th>
        
        {/* Customer */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '140px' }}>
          <span className="whitespace-nowrap">Customer</span>
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
