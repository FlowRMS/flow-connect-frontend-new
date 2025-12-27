'use client';

import React from 'react';
import AdvancedFilters from '../../AdvancedFilters';
import type { Quote } from '../types';

type QuickDatePreset = 'all' | 'today' | 'this_week' | 'last_week';
type QuickDateField = 'entryDate' | 'quoteDate';

type FilterOption = {
  id: string;
  label: string;
  type: 'dropdown' | 'date' | 'text' | 'number';
  columnName?: string;
  available?: boolean;
  options?: string[];
};

interface QuotesListHeaderProps {
  quotes: Quote[];
  viewMode: 'kanban' | 'list';
  setViewMode: (mode: 'kanban' | 'list') => void;
  quoteFilterOptions: FilterOption[];
  quickDatePreset: QuickDatePreset;
  setQuickDatePreset: (preset: QuickDatePreset) => void;
  quickDateField: QuickDateField;
  setQuickDateField: (field: QuickDateField) => void;
  showQuickDateFieldDropdown: boolean;
  setShowQuickDateFieldDropdown: (show: boolean) => void;
  onNewQuote?: () => void;
}

export function QuotesListHeader({
  quotes,
  viewMode,
  setViewMode,
  quoteFilterOptions,
  quickDatePreset,
  setQuickDatePreset,
  quickDateField,
  setQuickDateField,
  showQuickDateFieldDropdown,
  setShowQuickDateFieldDropdown,
  onNewQuote,
}: QuotesListHeaderProps) {
  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Quotes</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Summary Stats */}
            <div className="flex items-center gap-4 mr-4 text-sm">
              <div className="text-center">
                <p className="text-[var(--muted-foreground)]">Pipeline</p>
                <p className="font-semibold text-[var(--foreground)]">
                  ${quotes.filter(q => !['Won', 'Lost'].includes(q.stage)).reduce((sum, q) => sum + q.valueNumber, 0).toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[var(--muted-foreground)]">Won YTD</p>
                <p className="font-semibold text-green-600">
                  ${quotes.filter(q => q.stage === 'Won').reduce((sum, q) => sum + q.valueNumber, 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Kanban View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="18" rx="1"/>
                  <rect x="14" y="3" width="7" height="10" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="List View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>

            <AdvancedFilters filterOptions={quoteFilterOptions} />
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h14M6 8h11M9 12h8M12 16h5" strokeLinecap="round"/>
              </svg>
              Sort
            </button>
            <button
              onClick={onNewQuote}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              New Quote
            </button>
          </div>
        </div>
      </div>

      {/* Quick Date Filter */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-[var(--muted-foreground)]">Quick filter:</span>
        <div className="flex items-center bg-[var(--muted)]/30 rounded-lg p-1">
          {[
            { value: 'all', label: 'All' },
            { value: 'today', label: 'Today' },
            { value: 'this_week', label: 'This Week' },
            { value: 'last_week', label: 'Last Week' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setQuickDatePreset(option.value as QuickDatePreset)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                quickDatePreset === option.value
                  ? 'bg-white shadow-sm text-[var(--foreground)] font-medium'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {/* Date Field Selector */}
        <div className="relative">
          <button
            onClick={() => setShowQuickDateFieldDropdown(!showQuickDateFieldDropdown)}
            className="flex items-center gap-1 px-2 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-lg transition-colors"
          >
            <span>{quickDateField === 'entryDate' ? 'Entry Date' : 'Quote Date'}</span>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {showQuickDateFieldDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowQuickDateFieldDropdown(false)} />
              <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                <button
                  onClick={() => {
                    setQuickDateField('entryDate');
                    setShowQuickDateFieldDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors ${quickDateField === 'entryDate' ? 'text-[var(--primary)] font-medium' : ''}`}
                >
                  Entry Date
                </button>
                <button
                  onClick={() => {
                    setQuickDateField('quoteDate');
                    setShowQuickDateFieldDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors ${quickDateField === 'quoteDate' ? 'text-[var(--primary)] font-medium' : ''}`}
                >
                  Quote Date
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
