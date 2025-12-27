'use client';

import React from 'react';

interface ColumnDefinition {
  key: string;
  label: string;
  group: string;
}

interface ColumnsConfigModalProps<T extends string = string> {
  show: boolean;
  columnOrder: T[];
  columnDefinitions: ColumnDefinition[];
  visibleColumns: Set<T>;
  simpleViewColumns: Set<T>;
  quoteViewMode: 'simple' | 'overage';
  onClose: () => void;
  onToggleColumn: (colKey: T) => void;
}

export function ColumnsConfigModal<T extends string = string>({
  show,
  columnOrder,
  columnDefinitions,
  visibleColumns,
  simpleViewColumns,
  quoteViewMode,
  onClose,
  onToggleColumn,
}: ColumnsConfigModalProps<T>) {
  if (!show) return null;

  const simpleCommissionColumns: string[] = ['commissionPercent', 'commission', 'commissionTotal'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Configure Columns</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Check columns to show in table</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-1">
            {columnOrder
              .filter(colKey => {
                // In simple view, filter out overage/levels columns and advanced commission columns
                if (quoteViewMode === 'simple') {
                  const col = columnDefinitions.find(c => c.key === colKey);
                  // Allow basic commission columns in simple view
                  if (simpleCommissionColumns.includes(colKey)) {
                    return true;
                  }
                  if (col && ['Overage', 'Commission', 'Levels'].includes(col.group)) {
                    return false;
                  }
                }
                return true;
              })
              .map((colKey) => {
                const col = columnDefinitions.find(c => c.key === colKey);
                if (!col) return null;
                const isChecked = quoteViewMode === 'simple' ? simpleViewColumns.has(colKey) : visibleColumns.has(colKey);
                return (
                  <div
                    key={colKey}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-[var(--card)] border-[var(--border)] hover:bg-[var(--muted)]/50 transition-all"
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleColumn(colKey)}
                      className="w-5 h-5 accent-[var(--primary)] cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {/* Label */}
                    <span className="flex-1 text-sm font-medium">{col.label}</span>
                    {/* Group Badge */}
                    <span className="px-2 py-0.5 text-xs rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                      {col.group}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
