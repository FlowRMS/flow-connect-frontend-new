'use client';

import React, { useEffect } from 'react';
import type { SelectedItem } from '../FilesContent';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  items: SelectedItem[];
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  items,
  isPending,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPending) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isPending, onCancel]);

  if (!isOpen) return null;

  const folderCount = items.filter(i => i.type === 'folder').length;
  const fileCount = items.filter(i => i.type === 'file').length;

  const getDescription = () => {
    const parts = [];
    if (folderCount > 0) {
      parts.push(`${folderCount} folder${folderCount > 1 ? 's' : ''}`);
    }
    if (fileCount > 0) {
      parts.push(`${fileCount} file${fileCount > 1 ? 's' : ''}`);
    }
    return parts.join(' and ');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-red-600"
            >
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Delete {items.length > 1 ? 'Items' : 'Item'}?</h2>
            <p className="text-sm text-[var(--muted-foreground)]">This action cannot be undone</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-sm text-[var(--foreground)]">
            Are you sure you want to permanently delete {getDescription()}?
          </p>

          {items.length <= 5 && (
            <div className="mt-3 space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--muted)]/50"
                >
                  {item.type === 'folder' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                      <path
                        d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                        fill="currentColor"
                        fillOpacity="0.2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                      <path
                        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                        fill="currentColor"
                        fillOpacity="0.15"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                  <span className="text-sm text-[var(--foreground)] truncate">{item.name}</span>
                </div>
              ))}
            </div>
          )}

          {items.length > 5 && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-[var(--muted)]/50 text-sm text-[var(--muted-foreground)]">
              {items.slice(0, 3).map(i => i.name).join(', ')} and {items.length - 3} more...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2.5 text-sm font-medium rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Deleting...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
