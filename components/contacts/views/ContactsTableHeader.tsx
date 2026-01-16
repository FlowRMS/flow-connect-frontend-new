/**
 * ContactsTableHeader Component
 * Table header with column labels, sorting, and filters
 */

'use client';

import React, { useState, useCallback } from 'react';
import type { Contact } from '../types';
import { ColumnFilter } from '@/components/advancedFilters/components/ColumnFilter';
import type { ActiveFilter } from '@/components/advancedFilters/types';
import { getContactFilterOptions } from '../config/filterConfig';

interface ContactsTableHeaderProps {
  // Column filters
  onColumnFiltersChange?: (filters: Record<string, ActiveFilter[]>) => void;
  filterOptions?: ReturnType<typeof getContactFilterOptions>;
  columnFilters?: Record<string, ActiveFilter[]>;
}

export function ContactsTableHeader({
  onColumnFiltersChange,
  filterOptions = getContactFilterOptions(),
  columnFilters: parentColumnFilters,
}: ContactsTableHeaderProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  
  // Column filter state - use parent if provided, otherwise local state
  const [localColumnFilters, setLocalColumnFilters] = useState<Record<string, ActiveFilter[]>>({});
  const columnFilters = parentColumnFilters !== undefined ? parentColumnFilters : localColumnFilters;
  
  // Map from UI column keys to filter option IDs
  const columnKeyToFilterId: Record<string, string> = {
    name: 'first-name', // We'll filter by firstName (could also add lastName filter separately)
    company: 'company',
    role: 'role',
    createdAt: 'created-at',
    createdBy: 'created-by',
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
    const filterType = filterOption.type as 'text' | 'dropdown' | 'number' | 'date' | 'boolean';
    
    // Get filters for this column (ActiveFilter[])
    // Map columnKey to the actual filters stored under that key
    const columnFiltersForThisColumn = columnFilters[columnKey] || [];
    
    // For 'name' column, we need to map it to use firstName as columnName
    // but keep the columnKey as 'name' for state management
    const actualColumnName = columnKey === 'name' ? 'firstName' : filterOption.columnName;
    
    return (
      <ColumnFilter
        type={filterType}
        columnName={actualColumnName}
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
        {/* Name */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '200px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Name</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('name')}
            </div>
          </div>
        </th>

        {/* Company */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '150px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Company</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('company')}
            </div>
          </div>
        </th>

        {/* Role */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Role</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('role')}
            </div>
          </div>
        </th>

        {/* Tags */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
          <span className="whitespace-nowrap">Tags</span>
        </th>

        {/* Created At */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Created At</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('createdAt')}
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
      </tr>
    </thead>
  );
}
