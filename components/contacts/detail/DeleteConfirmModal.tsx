/**
 * Delete Confirmation Modal Component
 */

import React from 'react';

interface DeleteConfirmModalProps {
  contactName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  contactName,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)] mb-2">Delete Contact?</h3>
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mb-4 sm:mb-6">
          Are you sure you want to delete &quot;{contactName}&quot;? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2 sm:gap-3">
          <button
            onClick={onCancel}
            className="px-3 sm:px-4 py-1.5 sm:py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-xs sm:text-sm font-medium hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
