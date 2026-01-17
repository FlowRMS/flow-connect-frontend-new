'use client';

import React, { useState } from 'react';
import type { ItemChange, ItemChangeStatus } from '../../../lib/types/submittals';

interface EditChangeModalProps {
  change: ItemChange;
  onSave: (updates: Partial<ItemChange>) => void;
  onCancel: () => void;
}

export function EditChangeModal({ change, onSave, onCancel }: EditChangeModalProps) {
  const [status, setStatus] = useState<ItemChangeStatus>(change.status);
  const [notes, setNotes] = useState(change.notes.join('\n'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-[var(--card)] rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Edit Change</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ItemChangeStatus)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              <option value="approved">Approved</option>
              <option value="approved_as_noted">Approved as Noted</option>
              <option value="revise">Revise</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Notes (one per line)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ status, notes: notes.split('\n').filter(n => n.trim()) })}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)]"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
