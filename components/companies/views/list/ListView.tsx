'use client';

/**
 * List View Component for Companies
 * - Uses shared ColumnFilter component for column-level filters
 * - Sorting is handled globally via SortButton (no per-column sort here)
 */

import React, { useState } from 'react';
import type { Company } from '../../types';
import { getCompanyInitials, getLogoColor, formatDate } from '../../utils';
import { CompaniesTableSkeleton } from './components/CompaniesTableSkeleton';
import { ColumnFilter } from '@/components/advancedFilters/components/ColumnFilter';
import type { ActiveFilter, FilterOption } from '@/components/advancedFilters/types';

interface ListViewProps {
  companies: Company[];
  onCompanyClick: (company: Company) => void;
  isLoading?: boolean;
  columnFilters: Record<string, ActiveFilter[]>;
  onColumnFiltersChange: (filters: Record<string, ActiveFilter[]>) => void;
  filterOptions: FilterOption[];
  loadMoreRef?: (node: HTMLDivElement | null) => void;
  isFetchingNextPage?: boolean;
}

export default function ListView({
  companies,
  onCompanyClick,
  isLoading = false,
  columnFilters,
  onColumnFiltersChange,
  filterOptions,
  loadMoreRef,
  isFetchingNextPage = false,
}: ListViewProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  // Map from UI column keys to filter option IDs
  const columnKeyToFilterId: Record<string, string> = {
    name: 'name',
    companyTypeName: 'type',
    phone: 'phone',
    website: 'website',
    tags: 'tags',
    createdBy: 'createdBy',
    lastActivity: 'last-activity',
  };

  const renderColumnFilter = (columnKey: string) => {
    const filterId = columnKeyToFilterId[columnKey];
    if (!filterId) return null;

    const filterOption = filterOptions.find((f) => f.id === filterId);
    if (!filterOption || !filterOption.columnName) return null;

    const columnFiltersForThisColumn = columnFilters[columnKey] || [];

    // Preserve full type (supports companyType, etc.)
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
              <th className="px-4 md:px-6 py-2.5 md:py-3 text-left align-top">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Company Name
                  </span>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderColumnFilter('name')}
                  </div>
                </div>
              </th>
              <th className="px-2 md:px-3 py-2.5 md:py-3 text-left align-top">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Type
                  </span>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderColumnFilter('companyTypeName')}
                  </div>
                </div>
              </th>
              <th className="px-2 md:px-3 py-2.5 md:py-3 text-left align-top">
                <span className="text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Phone
                </span>
              </th>
              <th className="px-2 md:px-3 py-2.5 md:py-3 text-left align-top">
                <span className="text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Website
                </span>
              </th>
              <th className="px-2 md:px-3 py-2.5 md:py-3 text-left align-top">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Tags
                  </span>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderColumnFilter('tags')}
                  </div>
                </div>
              </th>
              <th className="px-2 md:px-3 py-2.5 md:py-3 text-left align-top">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Created By
                  </span>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderColumnFilter('createdBy')}
                  </div>
                </div>
              </th>
              <th className="px-2 md:px-3 py-2.5 md:py-3 text-left align-top">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Created
                  </span>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderColumnFilter('lastActivity')}
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {isLoading ? (
              <CompaniesTableSkeleton rowCount={8} />
            ) : (
              companies.map((company) => (
                <tr
                  key={company.id}
                  onClick={() => onCompanyClick(company)}
                  className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                >
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${getLogoColor(company.id)} flex items-center justify-center text-white text-[10px] md:text-xs font-bold flex-shrink-0`}>
                        {getCompanyInitials(company.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm md:text-base text-[var(--foreground)] truncate">
                          {company.name}
                        </h3>
                        <p className="text-[10px] md:text-xs text-[var(--muted-foreground)] truncate">
                          {company.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 md:px-3 py-3 md:py-4">
                    <span
                      className={`px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-xs font-medium whitespace-nowrap ${
                        company.companyTypeName?.toLowerCase() === 'manufacturer'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {company.companyTypeName || company.type?.[0] || 'Customer'}
                    </span>
                  </td>
                  <td className="px-2 md:px-3 py-3 md:py-4 min-w-0">
                    <span className="text-xs md:text-sm text-[var(--foreground)] truncate">
                      {company.phone || '-'}
                    </span>
                  </td>
                  <td className="px-2 md:px-3 py-3 md:py-4 min-w-0">
                    {company.website ? (
                      <a
                        href={`https://${company.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs md:text-sm text-[var(--primary)] hover:underline truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {company.website}
                      </a>
                    ) : (
                      <span className="text-xs md:text-sm text-[var(--muted-foreground)]">-</span>
                    )}
                  </td>
                  <td className="px-2 md:px-3 py-3 md:py-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      {company.tags.slice(0, 1).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 md:px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-[10px] md:text-xs truncate max-w-[60px]"
                        >
                          {tag}
                        </span>
                      ))}
                      {company.tags.length > 1 && (
                        <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">
                          +{company.tags.length - 1}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 md:px-3 py-3 md:py-4 min-w-0">
                    <span className="text-xs md:text-sm text-[var(--foreground)] truncate">
                      {company.createdBy || '—'}
                    </span>
                  </td>
                  <td className="px-2 md:px-3 py-3 md:py-4">
                    <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">
                      {formatDate(company.lastActivity)}
                    </span>
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
              <span>Loading more companies...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

