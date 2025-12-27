'use client';

import React from 'react';

interface ColumnDefinition {
  key: string;
  label: string;
}

interface SaveViewModalProps {
  show: boolean;
  newViewName: string;
  effectiveVisibleColumns: Set<string>;
  columnDefinitions: ColumnDefinition[];
  onClose: () => void;
  onSetNewViewName: (value: string) => void;
  onSave: () => void;
}

export function SaveViewModal({
  show,
  newViewName,
  effectiveVisibleColumns,
  columnDefinitions,
  onClose,
  onSetNewViewName,
  onSave,
}: SaveViewModalProps) {
  if (!show) return null;

  const handleClose = () => {
    onSetNewViewName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Save View</h2>
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
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              View Name
            </label>
            <input
              type="text"
              value={newViewName}
              onChange={(e) => onSetNewViewName(e.target.value)}
              placeholder="Enter view name..."
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              autoFocus
            />
          </div>
          <div className="bg-[var(--muted)]/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">Columns Included ({effectiveVisibleColumns.size})</h4>
            <div className="flex flex-wrap gap-2">
              {columnDefinitions.filter(c => effectiveVisibleColumns.has(c.key)).map(col => (
                <span key={col.key} className="px-2 py-1 bg-white border border-[var(--border)] rounded text-xs text-[var(--foreground)]">
                  {col.label}
                </span>
              ))}
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
            onClick={onSave}
            disabled={!newViewName.trim()}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save View
          </button>
        </div>
      </div>
    </div>
  );
}
