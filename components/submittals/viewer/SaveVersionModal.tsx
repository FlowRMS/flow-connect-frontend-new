'use client';

import React from 'react';

interface SaveVersionModalProps {
  isOpen: boolean;
  totalHighlights: number;
  versionName: string;
  onVersionNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function SaveVersionModal({
  isOpen,
  totalHighlights,
  versionName,
  onVersionNameChange,
  onSave,
  onCancel,
}: SaveVersionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Save as New Version
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          This will create a new version with {totalHighlights} highlights.
        </p>
        <input
          type="text"
          value={versionName}
          onChange={(e) => onVersionNameChange(e.target.value)}
          placeholder="Version name (e.g., 'Electrical Specs')"
          className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] mb-4"
          autoFocus
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!versionName.trim()}
            className="flex-1 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
          >
            Save Version
          </button>
        </div>
      </div>
    </div>
  );
}
