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
              <div className="fixed right-[200px] top-1/2 -translate-y-1/2 w-56 bg-white border border-[var(--border)] rounded-lg shadow-xl z-50 py-1">
                <button
                  onClick={() => {
                    onSetOverage();
                    setShowBulkActionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                >
                  Set Overage %
                </button>
                <button
                  onClick={() => {
                    onLockOverage();
                    setShowBulkActionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                >
                  Lock Overage
                </button>
                <button
                  onClick={() => {
                    onUnlockOverage();
                    setShowBulkActionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                >
                  Unlock Overage
                </button>
                <button
                  onClick={() => {
                    onSetEndUser();
                    setShowBulkActionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                >
                  Set End User
                </button>
                <button
                  onClick={() => {
                    onSetOutsideRepSplits();
                    setShowBulkActionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                >
                  Set Outside Rep Splits
                </button>
                <div className="border-t border-[var(--border)] my-1"></div>
                <button
                  onClick={() => {
                    onConvertToWarehouse();
                    setShowBulkActionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 text-teal-600"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7h14l-1.5 9H4.5L3 7z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 7V5a2 2 0 012-2v0a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Convert to Warehouse
                </button>
                <div className="border-t border-[var(--border)] my-1"></div>
                <button
                  onClick={() => {
                    onAddCredit();
                    setShowBulkActionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 text-red-600"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="10" cy="10" r="8"/>
                    <path d="M6 10h8" strokeLinecap="round"/>
                  </svg>
                  Add Line Credit
                </button>
                <button
                  onClick={() => {
                    onAddAcknowledgement();
                    setShowBulkActionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 text-blue-600"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Add Order Acknowledgement
                </button>
                <div className="border-t border-[var(--border)] my-1"></div>
                <button
                  onClick={() => {
                    onDeleteLines();
                    setShowBulkActionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 text-red-600"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h12M6 6V4a2 2 0 012-2h4a2 2 0 012 2v2M8 10v6M12 10v6M5 6l1 12a2 2 0 002 2h4a2 2 0 002-2l1-12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Delete Lines
                </button>
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
