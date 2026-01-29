'use client';

import React from 'react';
import SortButton, { type ActiveSort } from '@/components/SortButton';

interface SortOption {
  columnName: string;
  label: string;
}

interface ProductsFiltersProps {
  filteredCount: number;
  totalCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortOptions: SortOption[];
  activeSorts: ActiveSort[];
  onMultiSortChange: (sorts: ActiveSort[]) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export function ProductsFilters({
  filteredCount,
  totalCount,
  searchQuery,
  onSearchChange,
  sortOptions,
  activeSorts,
  onMultiSortChange,
  hasFilters,
  onClearFilters,
  isLoading,
  onRefresh,
}: ProductsFiltersProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="text-sm text-[var(--muted-foreground)] whitespace-nowrap">
        Showing {filteredCount} of {totalCount} products
      </div>
      <div className="relative flex-1 max-w-md">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search by part number...."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        />
      </div>
      <SortButton
        sortOptions={sortOptions}
        onMultiSortChange={onMultiSortChange}
        activeSorts={activeSorts}
      />
      <button
        onClick={onClearFilters}
        disabled={!hasFilters}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors ${
          hasFilters
            ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
            : 'border-[var(--border)] text-[var(--muted-foreground)] opacity-50 cursor-not-allowed'
        }`}
        title={hasFilters ? 'Clear all filters' : 'No filters to clear'}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        Clear Filters
      </button>
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
      >
        <svg
          className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>
    </div>
  );
}
