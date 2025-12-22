/**
 * BulkActionsBar Component
 * Shows when line items are selected, displays count and bulk action buttons
 */

'use client';

import React from 'react';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onConvertToWarehouse: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onConvertToWarehouse,
}: BulkActionsBarProps) {
  return (
    <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-teal-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">{selectedCount}</span>
          </div>
          <span className="text-sm font-medium text-teal-800">
            {selectedCount === 1 ? 'item selected' : 'items selected'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onConvertToWarehouse}
          className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M3 7h14l-1.5 9H4.5L3 7z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 7V5a2 2 0 012-2v0a2 2 0 012 2v2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Convert to Warehouse
        </button>
        <button
          onClick={onClearSelection}
          className="flex items-center gap-2 px-3 py-1.5 border border-teal-300 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
          </svg>
          Clear Selection
        </button>
      </div>
    </div>
  );
}

