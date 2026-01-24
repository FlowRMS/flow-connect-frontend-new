/**
 * BulkActionsBar Component
 * Shows when line items are selected, displays count and bulk action buttons
 */

'use client';

import React from 'react';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  // Bulk action handlers
  onSetOverage: () => void;
  onLockOverage: () => void;
  onUnlockOverage: () => void;
  onSetEndUser: () => void;
  onSetOutsideRepSplits: () => void;
  onConvertToWarehouse: () => void;
  onAddCredit: () => void;
  onAddAcknowledgement: () => void;
  onDeleteLines: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onSetOverage,
  onLockOverage,
  onUnlockOverage,
  onSetEndUser,
  onSetOutsideRepSplits,
  onConvertToWarehouse,
  onAddCredit,
  onAddAcknowledgement,
  onDeleteLines,
}: BulkActionsBarProps) {
  const [showBulkActionsMenu, setShowBulkActionsMenu] = React.useState(false);

  return (
    <div className="px-4 py-2 bg-[var(--primary)]/5 border border-[var(--border)] rounded-lg flex items-center justify-between">
      <span className="text-sm text-[var(--foreground)]">
        <strong>{selectedCount}</strong> line item{selectedCount !== 1 ? 's' : ''} selected
      </span>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowBulkActionsMenu(!showBulkActionsMenu)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            Bulk Actions
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {showBulkActionsMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowBulkActionsMenu(false)} />
              <div className="fixed right-[200px] top-1/2 -translate-y-1/2 w-64 bg-white border border-[var(--border)] rounded-lg shadow-xl z-50 py-3 px-4">
                <div className="flex flex-col items-center justify-center text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Coming Soon</h3>
                  <p className="text-sm text-gray-500">
                    Bulk actions for order line items are currently under development.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
        <button
          onClick={onClearSelection}
          className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
}
