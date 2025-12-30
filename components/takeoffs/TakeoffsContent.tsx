/**
 * Takeoffs Content Component
 * Main component that composes all takeoffs views and modals
 * Connected to flow-ai backend for real data
 */

'use client';

import React from 'react';
import { useTakeoffsState } from './hooks/useTakeoffsState';
import { TakeoffListView } from './views/TakeoffListView';
import { TakeoffDetailView } from './views/TakeoffDetailView';
import { UploadModal } from './modals/UploadModal';
import { AbridgmentReportModal } from './modals/AbridgmentReportModal';
import { TAKEOFF_FILTER_OPTIONS } from './constants';
import AdvancedFilters from '../AdvancedFilters';

export function TakeoffsContent() {
  const state = useTakeoffsState();
  const {
    viewMode,
    selectedTakeoff,
    activeFilters,
    setActiveFilters,
    searchQuery,
    setSearchQuery,
    showUploadModal,
    showAbridgmentReportModal,
    selectedDocument,
    takeoffs,
    isLoading,
    error,
    handleSelectTakeoff,
    handleBackToList,
    handleOpenUploadModal,
    handleCloseUploadModal,
    handleFileSelect,
    handleRemoveFile,
    handleUploadStart,
    handleCloseAbridgmentReport,
    handleOpenAbridgmentReport,
    handleCreateQuote,
    handleRefresh,
    // Handlers for detail view
    currentStep,
    setCurrentStep,
    documents,
    selectedItems,
    parsedItems,
    handleClassifyDocument,
    handleAbridgeDocument,
    handleAbridgeAll,
    handleCrossItem,
    handleCrossSelected,
    handleCrossAll,
    handleToggleSelectItem,
    handleSelectAllItems,
    uploadedFiles,
  } = state;

  return (
    <div className="p-6 relative">
      {/* Header - only show on list view */}
      {viewMode === 'list' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">Take-Offs</h1>
              {isLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--primary)]"></div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-3 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6"/>
                  <path d="M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
              </button>
              <button
                onClick={handleOpenUploadModal}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                + New Take-Off
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span className="text-sm">{error}</span>
              </div>
              <button
                onClick={handleRefresh}
                className="text-sm text-red-700 hover:text-red-900 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)]"
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="9" cy="9" r="7"/>
                <path d="M14 14l4 4"/>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search take-offs..."
                className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
              />
            </div>
            <AdvancedFilters
              filterOptions={TAKEOFF_FILTER_OPTIONS}
              activeFilters={activeFilters}
              onFiltersChange={setActiveFilters}
            />
          </div>

          {/* Loading State */}
          {isLoading && takeoffs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mb-4"></div>
              <p>Loading takeoffs...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && takeoffs.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 opacity-50">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              <p className="text-lg font-medium mb-2">No takeoffs yet</p>
              <p className="text-sm mb-4">Upload documents to create your first takeoff</p>
              <button
                onClick={handleOpenUploadModal}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                + New Take-Off
              </button>
            </div>
          )}

          {/* List View */}
          {!isLoading && takeoffs.length > 0 && (
            <TakeoffListView
              takeoffs={takeoffs}
              onTakeoffClick={handleSelectTakeoff}
            />
          )}
        </>
      )}

      {/* Detail View */}
      {viewMode === 'detail' && selectedTakeoff && (
        <TakeoffDetailView
          takeoff={selectedTakeoff}
          currentStep={currentStep}
          documents={documents}
          parsedItems={parsedItems}
          selectedItems={selectedItems}
          onBack={handleBackToList}
          onStepChange={setCurrentStep}
          onClassify={handleClassifyDocument}
          onAbridge={handleAbridgeDocument}
          onAbridgeAll={handleAbridgeAll}
          onViewReport={handleOpenAbridgmentReport}
          onCrossItem={handleCrossItem}
          onCrossSelected={handleCrossSelected}
          onCrossAll={handleCrossAll}
          onToggleSelect={handleToggleSelectItem}
          onSelectAll={handleSelectAllItems}
          onCreateQuote={handleCreateQuote}
        />
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        files={uploadedFiles}
        onClose={handleCloseUploadModal}
        onFileSelect={handleFileSelect}
        onRemoveFile={handleRemoveFile}
        onUploadStart={handleUploadStart}
      />

      {/* Abridgment Report Modal */}
      <AbridgmentReportModal
        isOpen={showAbridgmentReportModal}
        document={selectedDocument}
        onClose={handleCloseAbridgmentReport}
      />
    </div>
  );
}

export default TakeoffsContent;
