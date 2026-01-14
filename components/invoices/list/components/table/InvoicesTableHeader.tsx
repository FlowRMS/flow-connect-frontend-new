/**
 * InvoicesTableHeader Component
 * Table header with column labels, sorting, and filters
 */

'use client';

import React, { useState, useCallback } from 'react';
import type { Invoice } from '@/lib/types/rms';
import { ColumnFilter } from '@/components/advancedFilters/components/ColumnFilter';
import type { ActiveFilter } from '@/components/advancedFilters/types';
import { getInvoiceFilterOptions } from '../../config/filterConfig';

interface InvoicesTableHeaderProps {
  // Selection
  filteredInvoices: Invoice[];
  areAllEligibleSelected: boolean;
  isPartiallySelected?: boolean;
  onSelectAll: (checked: boolean) => void;
  // Column filters
  onColumnFiltersChange?: (filters: Record<string, ActiveFilter[]>) => void;
  filterOptions?: ReturnType<typeof getInvoiceFilterOptions>;
  columnFilters?: Record<string, ActiveFilter[]>;
}

export function InvoicesTableHeader({
  filteredInvoices,
  areAllEligibleSelected,
  isPartiallySelected,
  onSelectAll,
  onColumnFiltersChange,
  filterOptions = getInvoiceFilterOptions(),
  columnFilters: parentColumnFilters,
}: InvoicesTableHeaderProps) {
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
    invoiceNumber: 'invoice-number',
    status: 'status',
    total: 'total',
    commission: 'commission',
    invoiceDate: 'invoice-date',
    dueDate: 'due-date',
    entryDate: 'created-date',
    orderNumber: 'order-number',
    published: 'published',
    factoryName: 'factory-name',
  };
  
  // Handle column filter change - now receives ActiveFilter[]
  const handleColumnFilterChange = useCallback((columnKey: string, filters: ActiveFilter[]) => {
    // Always use the current columnFilters value (from props if parent provided, otherwise local state)
    // Use a function to get the latest value to avoid stale closures
    setColumnFilters((currentFilters) => {
      const newFilters = { ...currentFilters };
      
      // Remove filter if empty array
      if (filters.length === 0) {
        delete newFilters[columnKey];
      } else {
        newFilters[columnKey] = filters;
      }
      
      // Call the parent callback if provided
      if (onColumnFiltersChange) {
        onColumnFiltersChange(newFilters);
      }
      
      return newFilters;
    });
  }, [onColumnFiltersChange, setColumnFilters]);

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
    <thead className="bg-gray-50 border-b-2 border-gray-300 sticky top-0 z-10 shadow-sm">
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
            className="w-4 h-4 rounded border-gray-300 accent-indigo-600"
          />
        </th>

        {/* Preview */}
        <th className="w-10 px-3 py-3 text-center"></th>

        {/* Invoice # */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Invoice #</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('invoiceNumber')}
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

        {/* Order # */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '100px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Order #</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('orderNumber')}
            </div>
          </div>
        </th>

        {/* Invoice Date */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Invoice Date</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('invoiceDate')}
            </div>
          </div>
        </th>

        {/* Inv Amount */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
          <div className="flex items-center justify-end gap-1.5">
            <span className="whitespace-nowrap">Inv Amount</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('total')}
            </div>
          </div>
        </th>

        {/* Comm Amount */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
          <span className="whitespace-nowrap">Comm Amount</span>
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

        {/* Entry Date */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <span className="whitespace-nowrap">Entry Date</span>
        </th>

        {/* Created By */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '140px' }}>
          <span className="whitespace-nowrap">Created By</span>
        </th>

        {/* Due Date */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Due Date</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('dueDate')}
            </div>
          </div>
        </th>

        {/* Published */}
        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '80px' }}>
          <div className="flex items-center justify-center gap-1.5">
            <span className="whitespace-nowrap">Published</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('published')}
            </div>
          </div>
        </th>
      </tr>
    </thead>
  );
}

