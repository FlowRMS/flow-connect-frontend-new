'use client';

import React from 'react';

interface ModalFooterProps {
  onSave: () => void;
  onCancel: () => void;
}

export default function ModalFooter({ onSave, onCancel }: ModalFooterProps) {
  return (
    <div className="flex items-center justify-end gap-2 px-4 py-2 border-t border-[var(--border)] bg-[var(--card)] flex-shrink-0">
      <button
        onClick={onCancel}
        className="px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
      >
        Save Changes
      </button>
    </div>
  );
}
