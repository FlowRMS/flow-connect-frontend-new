/**
 * SetOverageModal Component
 * Modal for setting overage percentage on selected line items
 */

'use client';

import React from 'react';

interface SetOverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  overagePercent: string;
  setOveragePercent: (value: string) => void;
  onApply: () => void;
}

export function SetOverageModal({
  isOpen,
  onClose,
  selectedCount,
  overagePercent,
  setOveragePercent,
  onApply,
}: SetOverageModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-sm w-full">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Set Overage %</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Apply overage percentage to {selectedCount} selected line{selectedCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="p-6">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Overage Percentage
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              value={overagePercent}
              onChange={(e) => setOveragePercent(e.target.value)}
              className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              placeholder="e.g., 10"
            />
            <span className="text-sm text-[var(--muted-foreground)]">%</span>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
