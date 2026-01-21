/**
 * Shared Bulk Actions Toolbar Component
 * Displays selection count and bulk action buttons
 */

'use client';

import React from 'react';
import { ENTITY_DISPLAY_NAMES, type BulkDeleteEntityType } from '../lib/graphql/bulk-operations';

interface BulkActionsToolbarProps {
  entityType: BulkDeleteEntityType;
  selectedCount: number;
  totalCount: number;
  loadedCount: number;
  selectAllMode: boolean;
  onClearSelection: () => void;
  onDelete: () => void;
  /** Optional additional actions */
  additionalActions?: React.ReactNode;
}

export function BulkActionsToolbar({
  entityType,
  selectedCount,
  totalCount,
  loadedCount,
  selectAllMode,
  onClearSelection,
  onDelete,
  additionalActions,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  const entityNames = ENTITY_DISPLAY_NAMES[entityType];
  const displayName = selectedCount === 1 ? entityNames.singular : entityNames.plural;

  // Show "(including unloaded)" hint when in selectAllMode and there are unloaded items
  const showUnloadedHint = selectAllMode && totalCount > loadedCount;

  return (
    <div className="mb-4 p-3 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-[var(--foreground)]">
          {selectedCount} {displayName} selected
          {showUnloadedHint && (
            <span className="text-[var(--muted-foreground)] ml-1">(including unloaded)</span>
          )}
        </span>
        <button
          onClick={onClearSelection}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          Clear selection
        </button>
      </div>
      <div className="flex items-center gap-2">
        {additionalActions}
        <button
          onClick={onDelete}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete Selected
        </button>
      </div>
    </div>
  );
}
