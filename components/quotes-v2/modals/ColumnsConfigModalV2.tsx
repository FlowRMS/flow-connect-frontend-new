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

  const groups = ['Basic', 'Pricing', 'Commission'] as const;

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
              <p className="text-sm text-gray-500">Check columns to show in table</p>
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
          <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
            <div className="space-y-2">
              {columnConfig.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={col.visible}
                      onChange={() => toggleColumn(col.key)}
                      className="w-5 h-5 rounded border-gray-300 accent-indigo-600"
                    />
                    <span className="text-sm text-gray-900">{col.label}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                    {col.group}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
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
