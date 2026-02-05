'use client';

import React from 'react';
import type { QuoteForSubmittal } from '../types';

interface QuoteSelectionStepProps {
  selectedQuoteIds: Set<string>;
  setSelectedQuoteIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  quoteSearch: string;
  setQuoteSearch: (search: string) => void;
  filteredQuotes: QuoteForSubmittal[];
  isSearchingQuotes: boolean;
  isLoadingQuoteDetails: boolean;
}

export function QuoteSelectionStep({
  selectedQuoteIds,
  setSelectedQuoteIds,
  quoteSearch,
  setQuoteSearch,
  filteredQuotes,
  isSearchingQuotes,
  isLoadingQuoteDetails,
}: QuoteSelectionStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">
          {selectedQuoteIds.size} quote{selectedQuoteIds.size !== 1 ? 's' : ''} selected
        </p>
        {selectedQuoteIds.size > 0 && (
          <button
            onClick={() => setSelectedQuoteIds(new Set())}
            className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]"
          >
            Clear Selection
          </button>
        )}
      </div>

      <div className="relative">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
          <circle cx="9" cy="9" r="6" />
          <path d="M14 14l4 4" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={quoteSearch}
          onChange={(e) => setQuoteSearch(e.target.value)}
          placeholder="Search quotes by number or job name..."
          className="w-full pl-10 pr-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        />
        {isSearchingQuotes && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filteredQuotes.length === 0 && !isSearchingQuotes && (
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            <p>{quoteSearch ? 'No quotes found matching your search.' : 'Start typing to search for quotes.'}</p>
          </div>
        )}
        {filteredQuotes.map(quote => (
          <label
            key={quote.quoteId}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedQuoteIds.has(quote.quoteId)
                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                : 'border-[var(--border)] hover:bg-[var(--muted)]/50'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedQuoteIds.has(quote.quoteId)}
              onChange={() => {
                setSelectedQuoteIds(prev => {
                  const next = new Set(prev);
                  next.has(quote.quoteId) ? next.delete(quote.quoteId) : next.add(quote.quoteId);
                  return next;
                });
              }}
              className="accent-[var(--primary)] w-4 h-4"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[var(--foreground)]">{quote.name}</div>
              <div className="text-sm text-[var(--muted-foreground)]">
                {quote.id}{quote.customer ? ` • ${quote.customer}` : ''}
              </div>
            </div>
            <div className="text-right">
              {isLoadingQuoteDetails && selectedQuoteIds.has(quote.quoteId) ? (
                <div className="animate-spin h-4 w-4 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
              ) : (
                <div className="text-sm text-[var(--muted-foreground)]">
                  {quote.itemCount > 0 ? `${quote.itemCount} items` : '—'}
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
