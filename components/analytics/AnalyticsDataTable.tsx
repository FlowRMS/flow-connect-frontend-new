'use client';

import React, { useState, useMemo } from 'react';

type Column = {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
};

type FilterConfig = {
  key: string;
  label: string;
  type: 'text' | 'dropdown' | 'date' | 'dateRange';
  options?: { value: string; label: string }[];
};

type Props = {
  title: string;
  description: string;
  columns: Column[];
  data: Record<string, unknown>[];
  filters?: FilterConfig[];
  pageSize?: number;
  showExport?: boolean;
  showExpand?: boolean;
  showDateFormat?: boolean;
  showSaveView?: boolean;
  recordCount?: number;
};

export default function AnalyticsDataTable({
  title,
  description,
  columns,
  data,
  filters = [],
  pageSize = 25,
  showExport = true,
  showExpand = true,
  showDateFormat = true,
  showSaveView = true,
  recordCount,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [data, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{title}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 mb-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[var(--primary)] rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span className="font-medium text-[var(--foreground)]">Filter by Date Range</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Filter By</span>
              <select className="bg-[var(--input)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm">
                <option>Entity Date</option>
                <option>Created Date</option>
                <option>Modified Date</option>
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Period</span>
              <select className="bg-[var(--input)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm">
                <option>Custom Range</option>
                <option>This Month</option>
                <option>Last Month</option>
                <option>This Quarter</option>
                <option>This Year</option>
                <option>Last Year</option>
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Start Date</span>
              <input
                type="date"
                className="bg-[var(--input)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-center pt-5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">End Date</span>
              <input
                type="date"
                className="bg-[var(--input)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="ml-auto">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              <span>Advanced Filters</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
              >
                <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* YTD Mode */}
        <div className="mt-4 flex items-center gap-2">
          <input type="checkbox" id="ytd-mode" className="w-4 h-4 rounded border-[var(--border)]" />
          <label htmlFor="ytd-mode" className="text-sm text-[var(--foreground)]">Enable YTD Mode</label>
        </div>
      </div>

      {/* Table Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--muted-foreground)]">
            ({recordCount || data.length} records)
          </span>
          <button className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 015.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {showExpand && (
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
              Expand
            </button>
          )}

          {showDateFormat && (
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Date Format
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {showSaveView && (
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17,21 17,13 7,13 7,21"/>
                <polyline points="7,3 7,8 15,8"/>
              </svg>
              Save View
            </button>
          )}

          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
            Manage Views
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 15l5 5 5-5M7 9l5-5 5 5"/>
            </svg>
            Sort
            <span className="bg-white text-orange-500 text-xs px-1.5 py-0.5 rounded-full font-bold">1</span>
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            Clean
          </button>

          {showExport && (
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--success)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                    className={`px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider ${
                      col.sortable !== false ? 'cursor-pointer hover:text-[var(--foreground)]' : ''
                    } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortConfig?.key === col.key && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {paginatedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-[var(--muted)] transition-colors">
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-sm text-[var(--foreground)] ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
                      }`}
                    >
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
            <div className="text-sm text-[var(--muted-foreground)]">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-[var(--border)] text-sm disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded text-sm ${
                      currentPage === page
                        ? 'bg-[var(--primary)] text-white'
                        : 'border border-[var(--border)] hover:bg-[var(--muted)]'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-[var(--border)] text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
