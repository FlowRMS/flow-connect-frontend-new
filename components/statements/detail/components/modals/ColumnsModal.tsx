/**
 * ColumnsModal Component
 * Modal for toggling column visibility
 */

'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import type { ColumnKey } from '../../hooks/useStatementDetailState';

interface ColumnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  visibleColumns: Set<ColumnKey>;
  toggleColumn: (column: ColumnKey) => void;
}

const COLUMN_CONFIG: { key: ColumnKey; label: string }[] = [
  { key: 'lineNumber', label: 'Line #' },
  { key: 'partNumber', label: 'Part Number' },
  { key: 'custPartNumber', label: 'CPN' },
  { key: 'description', label: 'Description' },
  { key: 'soldTo', label: 'Sold To' },
  { key: 'endUser', label: 'End User' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'uom', label: 'UOM' },
  { key: 'divisor', label: 'Divisor' },
  { key: 'unitPrice', label: 'Unit Price' },
  { key: 'extendedPrice', label: 'Extended Price' },
  { key: 'commissionRate', label: 'Commission %' },
  { key: 'commission', label: 'Commission' },
  { key: 'outsideRep', label: 'Outside Rep' },
  { key: 'order', label: 'Order' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'note', label: 'Note' },
];

export function ColumnsModal({
  isOpen,
  onClose,
  visibleColumns,
  toggleColumn,
}: ColumnsModalProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Column Visibility</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-auto">
          <div className="space-y-2">
            {COLUMN_CONFIG.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.has(key)}
                  onChange={() => toggleColumn(key)}
                  className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-[var(--foreground)]">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-[var(--border)] bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
