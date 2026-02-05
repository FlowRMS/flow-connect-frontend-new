/**
 * ProductsTableHeader Component
 * Table header with column labels, sorting, and filters
 */

'use client';
 
import React, { useState, useCallback } from 'react';
import type { ProductLandingPage } from '../../../api/useProductsApi';
import { ColumnFilter } from '@/components/advancedFilters/components/ColumnFilter';
import type { ActiveFilter } from '@/components/advancedFilters/types';
import { getProductFilterOptions } from '../../../config/filterConfig';
import { SortIndicator } from '@/components/shared/sorting/components/SortIndicator';
import type { ActiveSort } from '@/components/shared/sorting/types';

interface ProductsTableHeaderProps {
  // Selection
  filteredProducts: ProductLandingPage[];
  areAllEligibleSelected: boolean;
  isPartiallySelected?: boolean;
  onSelectAll: (checked: boolean) => void;
  // Column filters
  onColumnFiltersChange?: (filters: Record<string, ActiveFilter[]>) => void;
  filterOptions?: ReturnType<typeof getProductFilterOptions>;
  columnFilters?: Record<string, ActiveFilter[]>;
  // Sorting
  activeSort?: { columnName: string; direction: 'ASC' | 'DESC' };
  onSortChange?: (columnName: string) => void;
  isFetching?: boolean;
}

export function ProductsTableHeader({
  filteredProducts,
  areAllEligibleSelected,
  isPartiallySelected,
  onSelectAll,
  onColumnFiltersChange,
  filterOptions = getProductFilterOptions([], [], []),
  columnFilters: parentColumnFilters,
  activeSort,
  onSortChange,
  isFetching = false,
}: ProductsTableHeaderProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  
  // Column filter state - use parent if provided, otherwise local state
  const [localColumnFilters, setLocalColumnFilters] = useState<Record<string, ActiveFilter[]>>({});
  const columnFilters = parentColumnFilters !== undefined ? parentColumnFilters : localColumnFilters;
  
  // Map from UI column keys to filter option IDs
  const columnKeyToFilterId: Record<string, string> = {
    factoryPartNumber: 'part-number',
    factoryTitle: 'factory',
    categoryTitle: 'category',
    uomTitle: 'uom',
    unitPrice: 'unit-price',
    defaultCommissionRate: 'commission-rate',
    published: 'published',
    approvalNeeded: 'approval-needed',
    createdAt: 'created-date',
    tags: 'tags',
  };

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
    const filterType = filterOption.type as 'text' | 'dropdown' | 'number' | 'date' | 'boolean' | 'factory' | 'category';
    
    // Get filters for this column (ActiveFilter[])
    const columnFiltersForThisColumn = columnFilters[columnKey] || [];
    
    // Extract factoryId from factory filter if category filter is being rendered
    // Note: This is a simplified approach - ideally we'd map factoryTitle to factoryId
    // For now, CategoryFilter will use a default UUID if no factoryId is provided
    const factoryId = filterType === 'category' ? undefined : undefined;
    
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
        factoryId={factoryId}
      />
    );
  };
  
  return (
    <thead className="bg-white border-b border-[var(--border)] sticky top-0 z-10">
      <tr>
        {/* Checkbox */}
        <th className="px-4 py-3 text-left w-12">
          <input
            type="checkbox"
            checked={areAllEligibleSelected}
            ref={(el) => {
              if (el) el.indeterminate = isPartiallySelected ?? false;
            }}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="w-4 h-4 text-[var(--primary)] border-[var(--border)] rounded focus:ring-[var(--primary)] cursor-pointer"
          />
        </th>

        {/* Part Number */}
        <th className="px-4 py-3 text-left">
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-[var(--foreground)]"
              onClick={() => onSortChange?.('factoryPartNumber')}
            >
              Part Number
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('factoryPartNumber')}
            </div>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator
                  columnId="factoryPartNumber"
                  activeSort={getActiveSortForColumn('factoryPartNumber')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>

        {/* Description - No filter */}
        <th className="px-4 py-3 text-left">
          <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
            Description
          </span>
        </th>

        {/* Factory */}
        <th className="px-4 py-3 text-left">
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-[var(--foreground)]"
              onClick={() => onSortChange?.('factoryTitle')}
            >
              Factory
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('factoryTitle')}
            </div>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator
                  columnId="factoryTitle"
                  activeSort={getActiveSortForColumn('factoryTitle')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>

        {/* Category */}
        <th className="px-4 py-3 text-left">
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-[var(--foreground)]"
              onClick={() => onSortChange?.('categoryTitle')}
            >
              Category
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('categoryTitle')}
            </div>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator
                  columnId="categoryTitle"
                  activeSort={getActiveSortForColumn('categoryTitle')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>

        {/* Unit Price */}
        <th className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <span
              className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-[var(--foreground)]"
              onClick={() => onSortChange?.('unitPrice')}
            >
              Unit Price
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('unitPrice')}
            </div>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator
                  columnId="unitPrice"
                  activeSort={getActiveSortForColumn('unitPrice')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>

        {/* Commission */}
        <th className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span
              className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-[var(--foreground)]"
              onClick={() => onSortChange?.('defaultCommissionRate')}
            >
              Commission
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('defaultCommissionRate')}
            </div>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator
                  columnId="defaultCommissionRate"
                  activeSort={getActiveSortForColumn('defaultCommissionRate')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>

        {/* Status (Published) */}
        <th className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span
              className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-[var(--foreground)]"
              onClick={() => onSortChange?.('published')}
            >
              Status
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('published')}
            </div>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator
                  columnId="published"
                  activeSort={getActiveSortForColumn('published')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>

        {/* Approval */}
        <th className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span
              className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-[var(--foreground)]"
              onClick={() => onSortChange?.('approvalNeeded')}
            >
              Approval
            </span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderColumnFilter('approvalNeeded')}
            </div>
            {onSortChange && (
              <div className="flex-shrink-0">
                <SortIndicator
                  columnId="approvalNeeded"
                  activeSort={getActiveSortForColumn('approvalNeeded')}
                  onSort={onSortChange}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        </th>

        {/* Entry Date */}
        <th className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span
              className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-[var(--foreground)]"
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

        {/* Actions */}
        <th className="px-4 py-3 text-center w-16">
          <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Actions
          </span>
        </th>
      </tr>
    </thead>
  );
}
