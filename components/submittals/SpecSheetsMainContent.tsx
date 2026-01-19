'use client';

import React from 'react';
import type { SpecSheet } from '../../lib/types/submittals';
import { SpecSheetCard, SpecSheetListItem } from './SpecSheetDisplayItems';

interface SpecSheetsMainContentProps {
  // Data
  filteredSpecSheets: SpecSheet[];
  selectedSpecSheet: SpecSheet | null;
  setSelectedSpecSheet: (sheet: SpecSheet | null) => void;
  selectedManufacturer: string;

  // Loading/Error state
  isLoadingSpecSheets: boolean;
  apiError: Error | null;
  searchQuery: string;

  // View mode
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;

  // Filters
  hasActiveFilters: boolean;
  clearFilters: () => void;

  // Highlight counts
  getHighlightCount: (specSheetId: string) => number;

  // Modals
  setShowUploadModal: (show: boolean) => void;
  setShowCatalogModal: (show: boolean) => void;

  // Multi-select
  selectedSpecSheetIds: Set<string>;
  toggleSpecSheetSelection: (id: string, isCtrlOrCmd: boolean) => void;
  selectAllVisibleSpecSheets: () => void;
  clearSpecSheetSelection: () => void;
}

export function SpecSheetsMainContent({
  filteredSpecSheets,
  selectedSpecSheet,
  setSelectedSpecSheet,
  selectedManufacturer,
  isLoadingSpecSheets,
  apiError,
  searchQuery,
  viewMode,
  setViewMode,
  hasActiveFilters,
  clearFilters,
  getHighlightCount,
  setShowUploadModal,
  setShowCatalogModal,
  selectedSpecSheetIds,
  toggleSpecSheetSelection,
  selectAllVisibleSpecSheets,
  clearSpecSheetSelection,
}: SpecSheetsMainContentProps) {
  const hasSelection = selectedSpecSheetIds.size > 0;
  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--foreground)]">
              Spec Sheets
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {filteredSpecSheets.length} spec sheet{filteredSpecSheets.length !== 1 ? 's' : ''}
              {selectedManufacturer ? ` from ${selectedManufacturer}` : ' from all manufacturers'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1 whitespace-nowrap"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
                Clear filters
              </button>
            )}

            {/* View Toggle */}
            <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-[var(--muted)]' : 'hover:bg-[var(--muted)]/50'} transition-colors`}
                title="Grid view"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="5" height="5" rx="1"/>
                  <rect x="12" y="3" width="5" height="5" rx="1"/>
                  <rect x="3" y="12" width="5" height="5" rx="1"/>
                  <rect x="12" y="12" width="5" height="5" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-[var(--muted)]' : 'hover:bg-[var(--muted)]/50'} transition-colors`}
                title="List view"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 5h12M4 10h12M4 15h12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <button
              onClick={() => setShowCatalogModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h12v12H4z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 8h12M8 4v12" strokeLinecap="round"/>
              </svg>
              Get from Open Catalog
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 14V6M6 10l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 17h14" strokeLinecap="round"/>
              </svg>
              Upload
            </button>
          </div>
        </div>
      </div>

      {/* Selection Bar */}
      {hasSelection && (
        <div className="flex-shrink-0 px-6 py-2 border-b border-[var(--border)] bg-blue-50 dark:bg-blue-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {selectedSpecSheetIds.size} selected
              </span>
              <button
                onClick={selectAllVisibleSpecSheets}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                Select all ({filteredSpecSheets.length})
              </button>
            </div>
            <button
              onClick={clearSpecSheetSelection}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
              Clear selection
            </button>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Drag selected items to a folder to move them
          </p>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoadingSpecSheets ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-[var(--muted-foreground)]">
              {searchQuery ? 'Searching...' : 'Loading spec sheets...'}
            </p>
          </div>
        ) : apiError ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Failed to load data</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              {apiError.message || 'An error occurred while loading spec sheets'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--primary)] border border-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/5 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4v5h5M16 16v-5h-5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.938 14.062A7.5 7.5 0 1017.5 10" strokeLinecap="round"/>
              </svg>
              Retry
            </button>
          </div>
        ) : filteredSpecSheets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No spec sheets found</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              {hasActiveFilters || searchQuery
                ? 'Try adjusting your filters'
                : 'Upload your first spec sheet to get started'}
            </p>
            {(hasActiveFilters || searchQuery) ? (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--primary)] border border-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/5 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 14V6M6 10l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 17h14" strokeLinecap="round"/>
                </svg>
                Upload Spec Sheet
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredSpecSheets.map(sheet => (
              <SpecSheetCard
                key={sheet.id}
                specSheet={sheet}
                highlightCount={getHighlightCount(sheet.id)}
                onClick={() => setSelectedSpecSheet(sheet)}
                isSelected={selectedSpecSheet?.id === sheet.id}
                isMultiSelected={selectedSpecSheetIds.has(sheet.id)}
                onToggleSelect={toggleSpecSheetSelection}
                selectedIds={selectedSpecSheetIds}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSpecSheets.map(sheet => (
              <SpecSheetListItem
                key={sheet.id}
                specSheet={sheet}
                highlightCount={getHighlightCount(sheet.id)}
                onClick={() => setSelectedSpecSheet(sheet)}
                isSelected={selectedSpecSheet?.id === sheet.id}
                isMultiSelected={selectedSpecSheetIds.has(sheet.id)}
                onToggleSelect={toggleSpecSheetSelection}
                selectedIds={selectedSpecSheetIds}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
