'use client';

import React from 'react';

interface FulfillmentTabsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCount: number;
  onAssignClick: () => void;
  onClearSelection: () => void;
}

export default function FulfillmentTabs({
  searchQuery,
  onSearchChange,
  selectedCount,
  onAssignClick,
  onClearSelection,
}: FulfillmentTabsProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      {/* Selection actions */}
      {selectedCount > 0 ? (
        <div className="flex items-center gap-3 bg-[var(--primary)]/10 px-4 py-2 rounded-lg">
          <span className="text-sm font-medium text-[var(--primary)]">
            {selectedCount} order{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <div className="h-4 w-px bg-[var(--primary)]/30" />
          <button
            onClick={onAssignClick}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Assign
          </button>
          <button
            onClick={onClearSelection}
            className="px-2 py-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="text-sm text-[var(--muted-foreground)]">
          Select orders to assign to a picker
        </div>
      )}

      <div className="flex-1" />

      <div className="relative max-w-xs">
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
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        />
      </div>
    </div>
  );
}

