/**
 * Customer List View Component
 * Displays customers in a table format
 * - Uses shared ColumnFilter component for column-level filters
 * - Sorting is handled globally via SortButton (no per-column sort here)
 */

'use client';

import React, { useState } from 'react';
import { type CustomerLandingPage } from '../../api/useCustomersApi';
import { CustomersTableSkeleton } from './components/CustomersTableSkeleton';
import { ColumnFilter } from '@/components/advancedFilters/components/ColumnFilter';
import type { ActiveFilter, FilterOption } from '@/components/advancedFilters/types';

interface ListViewProps {
  customers: CustomerLandingPage[];
  onCustomerClick: (customer: CustomerLandingPage) => void;
  onEditClick: (customer: CustomerLandingPage) => void;
  onDeleteClick: (customer: CustomerLandingPage) => void;
  selectedIds: Set<string>;
  excludedIds: Set<string>;
  selectAllMode: boolean;
  isItemSelected: (id: string) => boolean;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  isLoading?: boolean;
  columnFilters: Record<string, ActiveFilter[]>;
  onColumnFiltersChange: (filters: Record<string, ActiveFilter[]>) => void;
  filterOptions: FilterOption[];
  loadMoreRef?: (node: HTMLDivElement | null) => void;
  isFetchingNextPage?: boolean;
}

export function ListView({
  customers,
  onCustomerClick,
  onEditClick,
  onDeleteClick,
  isItemSelected,
  onSelectAll,
  onSelectOne,
  isAllSelected,
  isPartiallySelected,
  isLoading = false,
  columnFilters,
  onColumnFiltersChange,
  filterOptions,
  loadMoreRef,
  isFetchingNextPage = false,
}: ListViewProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  // Map from UI column keys to filter option IDs
  const columnKeyToFilterId: Record<string, string> = {
    companyName: 'companyName',
    isParent: 'isParent',
    published: 'published',
    parent: 'parent',
    createdAt: 'createdAt',
  };

  const renderColumnFilter = (columnKey: string) => {
    const filterId = columnKeyToFilterId[columnKey];
    if (!filterId) return null;

    const filterOption = filterOptions.find((f) => f.id === filterId);
    if (!filterOption || !filterOption.columnName) return null;

    const columnFiltersForThisColumn = columnFilters[columnKey] || [];

    // Preserve full type (supports text, dropdown, boolean, date, etc.)
    const filterType = filterOption.type as
      | 'text'
      | 'dropdown'
      | 'number'
      | 'date'
      | 'boolean'
      | 'month'
      | 'factory'
      | 'category'
      | 'company'
      | 'companyType';

    return (
      <ColumnFilter
        type={filterType}
        columnName={filterOption.columnName}
        value={columnFiltersForThisColumn}
        onChange={(filtersForColumn) => {
          const next = { ...columnFilters };
          if (!filtersForColumn || filtersForColumn.length === 0) {
            delete next[columnKey];
          } else {
            next[columnKey] = filtersForColumn;
          }
          onColumnFiltersChange(next);
        }}
        isOpen={openFilter === columnKey}
        onToggle={() => setOpenFilter(openFilter === columnKey ? null : columnKey)}
        filterOption={filterOption as any}
      />
    );
  };

  if (!isLoading && customers.length === 0) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-12 text-center">
        <svg className="mx-auto mb-4 w-16 h-16 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
        <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No customers found</h3>
        <p className="text-sm text-[var(--muted-foreground)]">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden flex flex-col flex-1 min-h-0">
      {/* Scrollable Table Container with fixed max height and always-visible scrollbars */}
      <div
        className="overflow-auto scrollbar-always-visible flex-1"
        style={{ maxHeight: 'calc(100vh - 320px)' }}
      >
        <table className="w-full min-w-[1200px]">
          <thead className="bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2.5 md:py-3 text-left align-top w-12">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isPartiallySelected;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 text-[var(--primary)] border-[var(--border)] rounded focus:ring-[var(--primary)] cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              </th>
              <th className="px-4 md:px-6 py-2.5 md:py-3 text-left align-top">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className="text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Company Name
                  </span>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderColumnFilter('companyName')}
                  </div>
                </div>
              </th>
              <th className="px-2 md:px-3 py-2.5 md:py-3 text-left align-top">
                <span className="text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                  Inside Reps
                </span>
              </th>
              <th className="px-2 md:px-3 py-2.5 md:py-3 text-left align-top">
                <span className="text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                  Outside Reps
                </span>
              </th>
              <th className="px-2 md:px-3 py-2.5 md:py-3 text-left align-top">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className="text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Hierarchy
                  </span>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderColumnFilter('isParent')}
                  </div>
                </div>
              </th>
              <th className="px-2 md:px-3 py-2.5 md:py-3 text-left align-top">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className="text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Parent
                  </span>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderColumnFilter('parent')}
                  </div>
                </div>
              </th>
              <th className="px-2 md:px-3 py-2.5 md:py-3 text-left align-top">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className="text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Status
                  </span>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderColumnFilter('published')}
                  </div>
                </div>
              </th>
              <th className="px-2 md:px-3 py-2.5 md:py-3 text-left align-top">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className="text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Created
                  </span>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderColumnFilter('createdAt')}
                  </div>
                </div>
              </th>
              <th className="px-2 md:px-3 py-2.5 md:py-3 text-right align-top">
                <span className="text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {isLoading ? (
              <CustomersTableSkeleton rowCount={8} />
            ) : (
              customers.map((customer) => (
                <tr
                  key={customer.id}
                  className={`hover:bg-[var(--muted)]/20 transition-colors cursor-pointer ${
                    isItemSelected(customer.id) ? 'bg-[var(--primary)]/5' : ''
                  }`}
                  onClick={() => onCustomerClick(customer)}
                >
                  <td className="px-4 py-3 md:py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isItemSelected(customer.id)}
                      onChange={(e) => onSelectOne(customer.id, e.target.checked)}
                      className="w-4 h-4 text-[var(--primary)] border-[var(--border)] rounded focus:ring-[var(--primary)] cursor-pointer"
                    />
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-[10px] md:text-xs font-bold flex-shrink-0">
                        {customer.companyName?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm md:text-base text-[var(--foreground)] truncate">
                          {customer.companyName || 'Unnamed Customer'}
                        </h3>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 md:px-3 py-3 md:py-4">
                    {customer.insideReps ? (
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-blue-100 text-blue-700">
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {customer.insideReps}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs md:text-sm text-[var(--muted-foreground)]">-</span>
                    )}
                  </td>
                  <td className="px-2 md:px-3 py-3 md:py-4">
                    {customer.outsideReps ? (
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-purple-100 text-purple-700">
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {customer.outsideReps}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs md:text-sm text-[var(--muted-foreground)]">-</span>
                    )}
                  </td>
                  <td className="px-2 md:px-3 py-3 md:py-4">
                    {/* Hierarchy: Buying Group (top) -> Parent Customer -> Customer */}
                    {customer.isParent && !customer.parent && !customer.buyingGroup ? (
                      <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-indigo-100 text-indigo-700 whitespace-nowrap">
                        Buying Group
                      </span>
                    ) : customer.isParent ? (
                      <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-purple-100 text-purple-700 whitespace-nowrap">
                        Parent
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-gray-100 text-gray-700 whitespace-nowrap">
                        Child
                      </span>
                    )}
                  </td>
                  <td className="px-2 md:px-3 py-3 md:py-4 min-w-0">
                    <span className="text-xs md:text-sm text-[var(--foreground)] truncate">
                      {customer.parent || '-'}
                    </span>
                  </td>
                  <td className="px-2 md:px-3 py-3 md:py-4">
                    <span className={`inline-flex items-center px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium whitespace-nowrap ${
                      customer.published
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {customer.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-2 md:px-3 py-3 md:py-4">
                    <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">
                      {formatDate(customer.createdAt)}
                    </span>
                  </td>
                  <td className="px-2 md:px-3 py-3 md:py-4 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEditClick(customer)}
                        className="p-1.5 md:p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                        title="Edit customer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDeleteClick(customer)}
                        className="p-1.5 md:p-2 text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete customer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Infinite scroll trigger - must be inside scrollable container */}
        {loadMoreRef && <div ref={loadMoreRef} className="h-4" />}
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span>Loading more customers...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
