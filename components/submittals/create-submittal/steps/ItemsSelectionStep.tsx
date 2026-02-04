'use client';

import React from 'react';
import type { QuoteLineItem } from '../types';

interface ItemsSelectionStepProps {
  lineItems: QuoteLineItem[];
  selectedItemIds: Set<string>;
  toggleItem: (id: string) => void;
  toggleAllItems: () => void;
  isLoadingQuoteDetails: boolean;
}

export function ItemsSelectionStep({
  lineItems,
  selectedItemIds,
  toggleItem,
  toggleAllItems,
  isLoadingQuoteDetails,
}: ItemsSelectionStepProps) {
  if (isLoadingQuoteDetails) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-[var(--primary)] border-t-transparent rounded-full mr-3" />
        <span className="text-[var(--muted-foreground)]">Loading line items...</span>
      </div>
    );
  }

  if (lineItems.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--muted-foreground)]">
        <p>No line items found for this quote.</p>
        <p className="text-sm mt-1">The quote may not have any products yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">
          {selectedItemIds.size} of {lineItems.length} items selected
        </p>
        <button
          onClick={toggleAllItems}
          className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]"
        >
          {selectedItemIds.size === lineItems.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {lineItems.map(item => (
          <label
            key={item.id}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedItemIds.has(item.id)
                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                : 'border-[var(--border)] hover:bg-[var(--muted)]/50'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedItemIds.has(item.id)}
              onChange={() => toggleItem(item.id)}
              className="accent-[var(--primary)]"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--foreground)]">{item.catalogNumber || 'No catalog #'}</span>
                {item.manufacturer && (
                  <span className="text-xs px-2 py-0.5 bg-[var(--muted)] rounded">{item.manufacturer}</span>
                )}
              </div>
              <p className="text-sm text-[var(--muted-foreground)] truncate">{item.description}</p>
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">
              Qty: {item.quantity}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
