'use client';

import React from 'react';
import type { SpecSheet } from '../../../lib/types/submittals';

type HighlightFilter = 'all' | 'highlighted' | 'not_highlighted';

interface HighlightsSectionProps {
  isExpanded: boolean;
  toggleSection: () => void;
  highlightFilter: HighlightFilter;
  setHighlightFilter: (filter: HighlightFilter) => void;
  allSpecSheets: SpecSheet[];
  setSelectedManufacturerId: (id: string | null) => void;
  setSelectedFolderId: (id: string | null) => void;
}

export function HighlightsSection({
  isExpanded,
  toggleSection,
  highlightFilter,
  setHighlightFilter,
  allSpecSheets,
  setSelectedManufacturerId,
  setSelectedFolderId,
}: HighlightsSectionProps) {
  return (
    <div className="border-b border-[var(--border)]">
      <button
        onClick={toggleSection}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-colors"
      >
        <span>Highlights</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        >
          <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {isExpanded && (
        <div className="px-4 pb-3 space-y-1">
          <button
            onClick={() => setHighlightFilter('all')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              highlightFilter === 'all' ? 'bg-[var(--muted)] font-medium' : 'hover:bg-[var(--muted)]/50'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="14" height="14" rx="2"/>
              <path d="M7 7h6M7 10h6M7 13h4"/>
            </svg>
            <span className="flex-1 text-left">All Sheets</span>
            <span className="text-xs text-[var(--muted-foreground)]">{allSpecSheets.length}</span>
          </button>
          <button
            onClick={() => {
              setHighlightFilter('highlighted');
              setSelectedManufacturerId(null);
              setSelectedFolderId(null);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              highlightFilter === 'highlighted' ? 'bg-green-100 text-green-700 font-medium' : 'hover:bg-[var(--muted)]/50'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-green-600">
              <path d="M9 12l2 2 4-4"/>
              <rect x="3" y="3" width="14" height="14" rx="2"/>
            </svg>
            <span className="flex-1 text-left">With Highlights</span>
            <span className={`text-xs ${highlightFilter === 'highlighted' ? 'text-green-600' : 'text-[var(--muted-foreground)]'}`}>
              {allSpecSheets.filter(s => (s.highlightCount || 0) > 0).length}
            </span>
          </button>
          <button
            onClick={() => {
              setHighlightFilter('not_highlighted');
              setSelectedManufacturerId(null);
              setSelectedFolderId(null);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              highlightFilter === 'not_highlighted' ? 'bg-orange-100 text-orange-700 font-medium' : 'hover:bg-[var(--muted)]/50'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-orange-500">
              <rect x="3" y="3" width="14" height="14" rx="2"/>
              <path d="M7 10h6"/>
            </svg>
            <span className="flex-1 text-left">Without Highlights</span>
            <span className={`text-xs ${highlightFilter === 'not_highlighted' ? 'text-orange-600' : 'text-[var(--muted-foreground)]'}`}>
              {allSpecSheets.filter(s => (s.highlightCount || 0) === 0).length}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
