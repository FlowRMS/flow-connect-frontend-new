'use client';

import React from 'react';
import type { SubmittalConfig } from '../../lib/types/submittals';

interface SubmittalConfigModalProps {
  editingConfig: SubmittalConfig;
  updateEditingConfig: (key: keyof SubmittalConfig, value: boolean) => void;
  onSave: () => void;
  onClose: () => void;
}

export function SubmittalConfigModal({
  editingConfig,
  updateEditingConfig,
  onSave,
  onClose,
}: SubmittalConfigModalProps) {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
      <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Submittal Configuration</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-4">
          {/* Include Options */}
          <div>
            <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Include Options</h4>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingConfig.includeLamps}
                  onChange={(e) => updateEditingConfig('includeLamps', e.target.checked)}
                  className="rounded border-[var(--border)]"
                />
                <span className="text-sm text-[var(--foreground)]">Lamps</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingConfig.includeAccessories}
                  onChange={(e) => updateEditingConfig('includeAccessories', e.target.checked)}
                  className="rounded border-[var(--border)]"
                />
                <span className="text-sm text-[var(--foreground)]">Accessories</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingConfig.includeCQ}
                  onChange={(e) => updateEditingConfig('includeCQ', e.target.checked)}
                  className="rounded border-[var(--border)]"
                />
                <span className="text-sm text-[var(--foreground)]">CQ</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingConfig.includeFromOrders}
                  onChange={(e) => updateEditingConfig('includeFromOrders', e.target.checked)}
                  className="rounded border-[var(--border)]"
                />
                <span className="text-sm text-[var(--foreground)]">From Orders</span>
              </label>
            </div>
          </div>

          {/* Rollup Options */}
          <div>
            <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Rollup Options</h4>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingConfig.rollUpKits}
                  onChange={(e) => updateEditingConfig('rollUpKits', e.target.checked)}
                  className="rounded border-[var(--border)]"
                />
                <span className="text-sm text-[var(--foreground)]">Roll up kits</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingConfig.rollUpAccessories}
                  onChange={(e) => updateEditingConfig('rollUpAccessories', e.target.checked)}
                  className="rounded border-[var(--border)]"
                />
                <span className="text-sm text-[var(--foreground)]">Roll up Accessories</span>
              </label>
            </div>
          </div>

          {/* Filter Options */}
          <div>
            <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Filter Options</h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingConfig.includeZeroQuantityItems}
                onChange={(e) => updateEditingConfig('includeZeroQuantityItems', e.target.checked)}
                className="rounded border-[var(--border)]"
              />
              <span className="text-sm text-[var(--foreground)]">Zero Quantity Items</span>
            </label>
          </div>

          {/* Display Options */}
          <div>
            <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Display Options</h4>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingConfig.dropDescriptions}
                  onChange={(e) => updateEditingConfig('dropDescriptions', e.target.checked)}
                  className="rounded border-[var(--border)]"
                />
                <span className="text-sm text-[var(--foreground)]">Drop Descriptions</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingConfig.dropLineNotes}
                  onChange={(e) => updateEditingConfig('dropLineNotes', e.target.checked)}
                  className="rounded border-[var(--border)]"
                />
                <span className="text-sm text-[var(--foreground)]">Drop Line Notes</span>
              </label>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
