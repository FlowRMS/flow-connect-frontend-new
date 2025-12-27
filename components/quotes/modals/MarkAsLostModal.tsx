'use client';

import React from 'react';
import type { Quote } from '../types';

interface MarkAsLostModalProps {
  show: boolean;
  lostReason: string;
  customLostReason: string;
  showAddReasonInput: boolean;
  newReasonText: string;
  lostReasons: string[];
  selectedQuotesForBulk: Set<string>;
  selectedQuote: Quote | null;
  onClose: () => void;
  onSetLostReason: (value: string) => void;
  onSetCustomLostReason: (value: string) => void;
  onSetShowAddReasonInput: (value: boolean) => void;
  onSetNewReasonText: (value: string) => void;
  onSetLostReasons: React.Dispatch<React.SetStateAction<string[]>>;
  onSubmit: (reason: string) => void;
}

export function MarkAsLostModal({
  show,
  lostReason,
  customLostReason,
  showAddReasonInput,
  newReasonText,
  lostReasons,
  onClose,
  onSetLostReason,
  onSetCustomLostReason,
  onSetShowAddReasonInput,
  onSetNewReasonText,
  onSetLostReasons,
  onSubmit,
}: MarkAsLostModalProps) {
  if (!show) return null;

  const handleClose = () => {
    onSetLostReason('');
    onSetCustomLostReason('');
    onSetShowAddReasonInput(false);
    onSetNewReasonText('');
    onClose();
  };

  const handleAddReason = () => {
    if (newReasonText.trim() && !lostReasons.includes(newReasonText.trim())) {
      const otherIndex = lostReasons.indexOf('Other');
      const newReasons = [...lostReasons];
      if (otherIndex !== -1) {
        newReasons.splice(otherIndex, 0, newReasonText.trim());
      } else {
        newReasons.push(newReasonText.trim());
      }
      onSetLostReasons(newReasons);
      onSetLostReason(newReasonText.trim());
      onSetNewReasonText('');
      onSetShowAddReasonInput(false);
    }
  };

  const handleSubmit = () => {
    const finalReason = lostReason === 'Other' ? customLostReason : lostReason;
    if (!finalReason) return;
    onSubmit(finalReason);
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Mark as Lost</h2>
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
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Reason for Loss <span className="text-red-500">*</span>
            </label>
            <select
              value={lostReason}
              onChange={(e) => onSetLostReason(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
            >
              <option value="">Select a reason...</option>
              {lostReasons.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          {lostReason === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Please specify <span className="text-red-500">*</span>
              </label>
              <textarea
                value={customLostReason}
                onChange={(e) => onSetCustomLostReason(e.target.value)}
                placeholder="Enter the reason..."
                rows={3}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* Add New Reason */}
          {!showAddReasonInput ? (
            <button
              onClick={() => onSetShowAddReasonInput(true)}
              className="flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v10M3 8h10" strokeLinecap="round"/>
              </svg>
              Add new reason to list
            </button>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--foreground)]">
                New Reason
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newReasonText}
                  onChange={(e) => onSetNewReasonText(e.target.value)}
                  placeholder="Enter new reason..."
                  className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  autoFocus
                />
                <button
                  onClick={handleAddReason}
                  disabled={!newReasonText.trim() || lostReasons.includes(newReasonText.trim())}
                  className="px-3 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    onSetNewReasonText('');
                    onSetShowAddReasonInput(false);
                  }}
                  className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  Cancel
                </button>
              </div>
              {newReasonText.trim() && lostReasons.includes(newReasonText.trim()) && (
                <p className="text-xs text-red-500">This reason already exists in the list</p>
              )}
            </div>
          )}

        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!lostReason || (lostReason === 'Other' && !customLostReason)}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark as Lost
          </button>
        </div>
      </div>
    </div>
  );
}
