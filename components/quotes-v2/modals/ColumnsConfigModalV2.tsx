'use client';

import React from 'react';
import type { ColumnConfig } from '../types';

interface ColumnsConfigModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  columnConfig: ColumnConfig[];
  onColumnConfigChange: (config: ColumnConfig[]) => void;
}

export function ColumnsConfigModalV2({
  isOpen,
  onClose,
  columnConfig,
  onColumnConfigChange,
}: ColumnsConfigModalV2Props) {
  if (!isOpen) return null;

  const toggleColumn = (key: string) => {
    onColumnConfigChange(
      columnConfig.map((c) =>
        c.key === key ? { ...c, visible: !c.visible } : c
      )
    );
  };

  const togglePinColumn = (key: string) => {
    onColumnConfigChange(
      columnConfig.map((c) =>
        c.key === key ? { ...c, pinned: !c.pinned } : c
      )
    );
  };

  const pinnedColumns = columnConfig.filter((c) => c.pinned && c.visible);
  const unpinnedColumns = columnConfig.filter((c) => !c.pinned);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Configure Columns</h2>
              <p className="text-sm text-gray-500">Toggle visibility and pin columns to freeze them</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-2 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3 text-xs font-semibold text-gray-500 uppercase">
              <div className="w-5"></div>
              <span className="flex-1">Column</span>
              <span className="w-16 text-center">Pin Left</span>
            </div>
          </div>
          <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
            <div className="space-y-1">
              {/* Pinned columns section */}
              {pinnedColumns.length > 0 && (
                <>
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Pinned Columns (Frozen Left)
                  </div>
                  {pinnedColumns.map((col) => (
                    <div
                      key={col.key}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-all bg-blue-50 border-blue-200"
                    >
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => toggleColumn(col.key)}
                        className="w-5 h-5 rounded border-gray-300 accent-indigo-600 cursor-pointer"
                      />
                      <span className="flex-1 text-sm font-medium text-blue-700">
                        {col.label}
                      </span>
                      <button
                        onClick={() => togglePinColumn(col.key)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors bg-blue-500 text-white hover:bg-blue-600"
                        title="Unpin column"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 my-3"></div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Other Columns
                  </div>
                </>
              )}
              {/* Unpinned columns */}
              {unpinnedColumns.map((col) => (
                <div
                  key={col.key}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-all bg-white border-gray-200 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={col.visible}
                    onChange={() => toggleColumn(col.key)}
                    className="w-5 h-5 rounded border-gray-300 accent-indigo-600 cursor-pointer"
                  />
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {col.label}
                  </span>
                  <button
                    onClick={() => togglePinColumn(col.key)}
                    disabled={!col.visible}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                      col.visible
                        ? 'hover:bg-gray-200 text-gray-600'
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

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {pinnedColumns.length > 0 && (
                <span className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                    <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {pinnedColumns.length} column{pinnedColumns.length !== 1 ? 's' : ''} pinned
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ColumnsConfigModalV2;
