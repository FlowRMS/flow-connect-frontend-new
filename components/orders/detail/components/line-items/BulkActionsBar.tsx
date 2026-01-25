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
  onGenerateFulfillmentRequest: () => void;
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
  onGenerateFulfillmentRequest,
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
              <div className="absolute right-0 top-full mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl z-50 py-1">
                <button
                  onClick={() => { onGenerateFulfillmentRequest(); setShowBulkActionsMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600">
                    <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Generate Fulfillment Request
                </button>
                <div className="border-t border-[var(--border)] my-1" />
                <div className="px-4 py-2">
                  <span className="text-xs text-[var(--muted-foreground)]">More actions coming soon</span>
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
