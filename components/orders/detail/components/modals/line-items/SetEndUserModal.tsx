/**
 * SetEndUserModal Component
 * Modal for setting end user on selected line items
 */

'use client';

import React from 'react';

interface SetEndUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  endUser: string;
  setEndUser: (value: string) => void;
  onApply: () => void;
}

export function SetEndUserModal({
  isOpen,
  onClose,
  selectedCount,
  endUser,
  setEndUser,
  onApply,
}: SetEndUserModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-sm w-full">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Set End User</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Apply end user to {selectedCount} selected line{selectedCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="p-6">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            End User
          </label>
          <select
            value={endUser}
            onChange={(e) => setEndUser(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          >
            <option value="">Select End User...</option>
            <option value="customer1">Skanska USA</option>
            <option value="customer2">Turner Construction</option>
            <option value="customer3">McCarthy Building</option>
            <option value="customer4">Whiting-Turner</option>
          </select>
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
