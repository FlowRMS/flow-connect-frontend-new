'use client';

import React from 'react';

interface ModalFooterProps {
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
}

export default function ModalFooter({
  onSave,
  onCancel,
  isSaving = false,
  hasUnsavedChanges = false,
}: ModalFooterProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)] bg-[var(--card)] flex-shrink-0">
      <div className="text-xs text-[var(--muted-foreground)]">
        {hasUnsavedChanges && !isSaving && 'You have unsaved changes'}
        {isSaving && 'Saving...'}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving && (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
          )}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
