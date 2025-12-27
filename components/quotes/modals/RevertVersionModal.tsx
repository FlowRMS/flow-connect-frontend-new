'use client';

import React from 'react';

interface RevertVersionModalProps {
  show: boolean;
  currentVersion: number;
  onClose: () => void;
  onRevert: () => void;
}

export function RevertVersionModal({
  show,
  currentVersion,
  onClose,
  onRevert,
}: RevertVersionModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Revert to Previous Version</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600 flex-shrink-0 mt-0.5">
                <path d="M10 6v4M10 14h.01" strokeLinecap="round"/>
                <path d="M3 17l7-12 7 12H3z"/>
              </svg>
              <div>
                <p className="font-medium text-orange-800">This action will revert your quote</p>
                <p className="text-sm text-orange-700 mt-1">
                  All changes made since this version will be discarded. This cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-[var(--muted-foreground)]">Reverting to:</p>
            <div className="p-3 bg-[var(--muted)]/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-gray-100 rounded text-sm font-semibold">v2</span>
                  <span className="text-sm text-[var(--foreground)]">Mar 18, 2024</span>
                </div>
                <span className="text-sm font-medium text-[var(--foreground)]">$2,380,000</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Added fixtures</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="save-current" className="accent-[var(--primary)]" />
            <label htmlFor="save-current" className="text-sm text-[var(--foreground)]">
              Save current version as v{currentVersion + 1} before reverting
            </label>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onRevert}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors"
          >
            Revert to v2
          </button>
        </div>
      </div>
    </div>
  );
}
