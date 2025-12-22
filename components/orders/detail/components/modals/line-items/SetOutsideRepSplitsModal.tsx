/**
 * SetOutsideRepSplitsModal Component
 * Modal for setting outside rep splits on selected line items
 */

'use client';

import React from 'react';

interface SetOutsideRepSplitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  outsideRep: string;
  setOutsideRep: (value: string) => void;
  splitPercentage: string;
  setSplitPercentage: (value: string) => void;
  onApply: () => void;
}

export function SetOutsideRepSplitsModal({
  isOpen,
  onClose,
  selectedCount,
  outsideRep,
  setOutsideRep,
  splitPercentage,
  setSplitPercentage,
  onApply,
}: SetOutsideRepSplitsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Set Outside Rep Splits</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Configure commission splits for {selectedCount} selected line{selectedCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Outside Rep
            </label>
            <select
              value={outsideRep}
              onChange={(e) => setOutsideRep(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              <option value="">Select Rep...</option>
              <option value="rep1">John Smith</option>
              <option value="rep2">Sarah Johnson</option>
              <option value="rep3">Mike Williams</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Split Percentage
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="1"
                value={splitPercentage}
                onChange={(e) => setSplitPercentage(e.target.value)}
                className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                placeholder="e.g., 50"
              />
              <span className="text-sm text-[var(--muted-foreground)]">%</span>
            </div>
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
