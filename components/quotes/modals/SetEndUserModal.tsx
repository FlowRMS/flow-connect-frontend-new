'use client';

import React from 'react';
import type { Quote } from '../types';

interface SetEndUserModalProps {
  show: boolean;
  selectedQuote: Quote | null;
  selectedLineItems: Set<string>;
  selectedEndUser: string;
  availableEndUsers: string[];
  onClose: () => void;
  onSetSelectedEndUser: (value: string) => void;
  onApply: (endUser: string) => void;
}

export function SetEndUserModal({
  show,
  selectedQuote,
  selectedLineItems,
  selectedEndUser,
  availableEndUsers,
  onClose,
  onSetSelectedEndUser,
  onApply,
}: SetEndUserModalProps) {
  if (!show || !selectedQuote) return null;

  const handleClose = () => {
    onSetSelectedEndUser('');
    onClose();
  };

  const handleApply = () => {
    onApply(selectedEndUser);
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Set End User</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            Set the end user for {selectedLineItems.size} selected line item{selectedLineItems.size !== 1 ? 's' : ''}.
          </p>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              End User
            </label>
            <select
              value={selectedEndUser}
              onChange={(e) => onSetSelectedEndUser(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              autoFocus
            >
              <option value="">{selectedQuote.soldToCustomer} (Default)</option>
              {availableEndUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="bg-[var(--muted)]/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">Preview</h4>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Lines to Update:</span>
              <span className="text-[var(--foreground)]">{selectedLineItems.size}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-[var(--muted-foreground)]">New End User:</span>
              <span className="font-medium text-[var(--foreground)]">
                {selectedEndUser || selectedQuote.soldToCustomer}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
          >
            Apply to {selectedLineItems.size} Line{selectedLineItems.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
