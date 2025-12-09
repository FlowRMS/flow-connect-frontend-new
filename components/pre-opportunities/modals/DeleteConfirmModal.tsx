/**
 * Delete Confirmation Modal Component for Pre-Opportunities
 */

import React from 'react';

interface DeleteConfirmModalProps {
  entityNumber: string;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  entityNumber,
  isPending,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Delete Pre-Opportunity?</h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          Are you sure you want to delete pre-opportunity &quot;{entityNumber}&quot;? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
