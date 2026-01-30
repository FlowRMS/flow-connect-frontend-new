/**
 * ColumnsModal Component
 * Modal for configuring column visibility and pinning
 */

'use client';

import React, { useMemo } from 'react';
import type { ColumnKey } from '../../../types';
import type { OrderColumnConfig } from '@/components/lib/graphql/settings';

interface ColumnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnConfig: OrderColumnConfig[];
  onColumnConfigChange: (config: OrderColumnConfig[]) => void;
}

export function ColumnsModal({
  isOpen,
  onClose,
  columnConfig,
  onColumnConfigChange,
}: ColumnsModalProps) {
  if (!isOpen) return null;

  // Derive visible and pinned columns from columnConfig
  const visibleColumns = useMemo(() => {
    return new Set<ColumnKey>(
      columnConfig.filter(col => col.visible).map(col => col.key as ColumnKey)
    );
  }, [columnConfig]);

  const pinnedColumns = useMemo(() => {
    return new Set<ColumnKey>(
      columnConfig.filter(col => col.visible && col.pinned).map(col => col.key as ColumnKey)
    );
  }, [columnConfig]);

  const toggleColumn = (key: ColumnKey) => {
    onColumnConfigChange(
      columnConfig.map((c) =>
        c.key === key ? { ...c, visible: !c.visible, pinned: !c.visible ? false : c.pinned } : c
      )
    );
  };

  const togglePinColumn = (key: ColumnKey) => {
    onColumnConfigChange(
      columnConfig.map((c) => {
        if (c.key === key) {
          // If pinning, ensure it's also visible
          return { ...c, pinned: !c.pinned, visible: !c.pinned || c.visible };
        }
        return c;
      })
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Configure Columns</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Toggle visibility and pin columns to freeze them</p>
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
        <div className="px-6 py-2 border-b border-[var(--border)] bg-[var(--muted)]/30">
          <div className="flex items-center gap-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
            <div className="w-5"></div>
            <span className="flex-1">Column</span>
            <span className="w-16 text-center">Pin Left</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-1">
            {/* Pinned columns section */}
            {pinnedColumns.size > 0 && (
              <>
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Pinned Columns (Frozen Left)
                </div>
                {columnConfig.filter(col => col.pinned && col.visible).map(col => (
                  <div
                    key={col.key}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-all bg-blue-50 border-blue-200"
                  >
                    <input
                      type="checkbox"
                      checked={col.visible}
                      onChange={() => toggleColumn(col.key as ColumnKey)}
                      className="w-5 h-5 accent-[var(--primary)] cursor-pointer"
                    />
                    <span className="flex-1 text-sm font-medium text-blue-700">
                      {col.label}
                    </span>
                    <button
                      onClick={() => togglePinColumn(col.key as ColumnKey)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors bg-blue-500 text-white hover:bg-blue-600"
                      title="Unpin column"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
                <div className="border-t border-[var(--border)] my-3"></div>
                <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                  Other Columns
                </div>
              </>
            )}
            {/* Unpinned columns */}
            {columnConfig.filter(col => !col.pinned).map(col => (
              <div
                key={col.key}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-all bg-[var(--card)] border-[var(--border)] hover:bg-[var(--muted)]/50"
              >
                <input
                  type="checkbox"
                  checked={col.visible}
                  onChange={() => toggleColumn(col.key as ColumnKey)}
                  className="w-5 h-5 accent-[var(--primary)] cursor-pointer"
                />
                <span className="flex-1 text-sm font-medium">
                  {col.label}
                </span>
                <button
                  onClick={() => togglePinColumn(col.key as ColumnKey)}
                  disabled={!col.visible}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                    col.visible
                      ? 'hover:bg-[var(--muted)] text-[var(--muted-foreground)]'
                      : 'opacity-30 cursor-not-allowed'
                  }`}
                  title="Pin column to left"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
          <div className="text-sm text-[var(--muted-foreground)]">
            {pinnedColumns.size > 0 && (
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {pinnedColumns.size} column{pinnedColumns.size !== 1 ? 's' : ''} pinned
              </span>
            )}
          </div>
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
