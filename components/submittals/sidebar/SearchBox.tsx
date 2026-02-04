'use client';

import React from 'react';

interface SearchBoxProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function SearchBox({ searchQuery, setSearchQuery }: SearchBoxProps) {
  return (
    <div className="p-4 border-b border-[var(--border)]">
      <div className="relative">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
          <circle cx="9" cy="9" r="6"/>
          <path d="M15 15l-3-3" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          placeholder="Search spec sheets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
