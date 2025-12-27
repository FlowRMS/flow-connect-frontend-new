'use client';

import React from 'react';

interface SectionsSettingsModalProps {
  show: boolean;
  showSections: boolean;
  sectionDisplayMode: 'column' | 'lineShelf';
  onClose: () => void;
  onSetShowSections: (value: boolean) => void;
  onSetSectionDisplayMode: (mode: 'column' | 'lineShelf') => void;
}

export function SectionsSettingsModal({
  show,
  showSections,
  sectionDisplayMode,
  onClose,
  onSetShowSections,
  onSetSectionDisplayMode,
}: SectionsSettingsModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Section Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* Enable Sections Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-[var(--foreground)]">Enable Sections</div>
              <div className="text-sm text-[var(--muted-foreground)]">Group line items by section</div>
            </div>
            <button
              onClick={() => onSetShowSections(!showSections)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showSections ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                showSections ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Display Mode - only show when sections are enabled */}
          {showSections && (
            <div className="space-y-3">
              <div className="font-medium text-[var(--foreground)]">Display Mode</div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--muted)]/50 transition-colors">
                  <input
                    type="radio"
                    name="sectionDisplayMode"
                    checked={sectionDisplayMode === 'column'}
                    onChange={() => onSetSectionDisplayMode('column')}
                    className="accent-[var(--primary)]"
                  />
                  <div>
                    <div className="font-medium text-[var(--foreground)]">Column Mode</div>
                    <div className="text-sm text-[var(--muted-foreground)]">Show section as a column in the table</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--muted)]/50 transition-colors">
                  <input
                    type="radio"
                    name="sectionDisplayMode"
                    checked={sectionDisplayMode === 'lineShelf'}
                    onChange={() => onSetSectionDisplayMode('lineShelf')}
                    className="accent-[var(--primary)]"
                  />
                  <div>
                    <div className="font-medium text-[var(--foreground)]">Line Shelf Mode</div>
                    <div className="text-sm text-[var(--muted-foreground)]">Show section headers as row dividers</div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
