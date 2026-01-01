/**
 * Takeoffs Content Component
 * Main component that composes all takeoffs views and modals
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
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Take-Offs</h1>
            <button
              onClick={handleOpenUploadModal}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              + New Take-Off
            </button>
          </div>

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

          {/* List View */}
          <TakeoffListView
            takeoffs={takeoffs}
            onTakeoffClick={handleSelectTakeoff}
          />
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
