/**
 * ColumnsModal Component
 * Modal for toggling column visibility in the line items table
 */

'use client';

import React from 'react';
import type { ColumnKey } from '../../types';
import { COLUMN_LABELS } from '../../constants';

interface ColumnsModalProps {
  visibleColumns: Set<ColumnKey>;
  onToggleColumn: (column: ColumnKey) => void;
  onClose: () => void;
}

export function ColumnsModal({
  visibleColumns,
  onToggleColumn,
  onClose,
}: ColumnsModalProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-[var(--card)] rounded-lg shadow-xl z-50">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold">Toggle Columns</h3>
        </div>
        <div className="p-4 max-h-[400px] overflow-y-auto">
          {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((col) => (
            <label
              key={col}
              className="flex items-center gap-3 py-2 cursor-pointer hover:bg-[var(--muted)] px-2 rounded"
            >
              <input
                type="checkbox"
                checked={visibleColumns.has(col)}
                onChange={() => onToggleColumn(col)}
                className="accent-[var(--primary)]"
              />
              <span className="text-sm">{COLUMN_LABELS[col]}</span>
            </label>
          ))}
        </div>
        <div className="p-4 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}

