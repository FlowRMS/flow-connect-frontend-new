'use client';

import React from 'react';
import type { SpecSheet } from '../../lib/types/submittals';

interface Manufacturer {
  id: string;
  name: string;
}

interface SpecSheetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  specSheetSearch: string;
  setSpecSheetSearch: (search: string) => void;
  specSheetManufacturerId: string | null;
  setSpecSheetManufacturerId: (id: string | null) => void;
  manufacturers: Manufacturer[];
  isLoadingManufacturers: boolean;
  filteredSpecSheets: SpecSheet[];
  isLoadingSpecSheets: boolean;
  onSelectSpecSheet: (specSheetId: string) => void;
}

export function SpecSheetPickerModal({
  isOpen,
  onClose,
  specSheetSearch,
  setSpecSheetSearch,
  specSheetManufacturerId,
  setSpecSheetManufacturerId,
  manufacturers,
  isLoadingManufacturers,
  filteredSpecSheets,
  isLoadingSpecSheets,
  onSelectSpecSheet,
}: SpecSheetPickerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
      <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Select Spec Sheet</h3>
          <button
            onClick={() => {
              onClose();
              setSpecSheetSearch('');
            }}
            className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-4 border-b border-[var(--border)] space-y-3">
          {/* Manufacturer selector */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Manufacturer</label>
            <select
              value={specSheetManufacturerId || ''}
              onChange={(e) => setSpecSheetManufacturerId(e.target.value || null)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm"
              disabled={isLoadingManufacturers}
            >
              {isLoadingManufacturers ? (
                <option>Loading manufacturers...</option>
              ) : manufacturers.length === 0 ? (
                <option>No manufacturers found</option>
              ) : (
                manufacturers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))
              )}
            </select>
          </div>
          {/* Search input */}
          <div className="relative">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
              <circle cx="9" cy="9" r="6"/>
              <path d="M14 14l4 4" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={specSheetSearch}
              onChange={(e) => setSpecSheetSearch(e.target.value)}
              placeholder="Search spec sheets..."
              className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
            {isLoadingSpecSheets && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {isLoadingSpecSheets ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
            </div>
          ) : filteredSpecSheets.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted-foreground)]">
              <p className="text-sm">
                {specSheetManufacturerId
                  ? 'No spec sheets found for this manufacturer.'
                  : 'Select a manufacturer to view spec sheets.'}
              </p>
            </div>
          ) : (
            filteredSpecSheets.map(specSheet => (
              <button
                key={specSheet.id}
                onClick={() => onSelectSpecSheet(specSheet.id)}
                className="w-full p-3 text-left rounded-lg hover:bg-[var(--muted)]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <path d="M14 2v6h6"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{specSheet.displayName}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {specSheet.manufacturer} • {specSheet.pageCount} pages
                      {specSheet.highlightCount && specSheet.highlightCount > 0 && (
                        <span className="ml-2 text-amber-600">• {specSheet.highlightCount} highlight{specSheet.highlightCount !== 1 ? 's' : ''}</span>
                      )}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
