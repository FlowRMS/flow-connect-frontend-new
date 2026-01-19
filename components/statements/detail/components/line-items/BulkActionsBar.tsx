/**
 * BulkActionsBar Component
 * Shows actions for selected line items
 */

'use client';

import React from 'react';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onDeleteSelected,
}: BulkActionsBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-emerald-50 border-b border-emerald-100">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-emerald-700">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <button
          onClick={onClearSelection}
          className="text-sm text-emerald-600 hover:text-emerald-700 underline"
        >
          Clear selection
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onDeleteSelected}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}
