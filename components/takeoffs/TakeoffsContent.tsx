/**
 * Takeoffs Content Component
 * Main component that composes all takeoffs views and modals
 * Connected to flow-ai backend for real data
 * FlowCRM style
 */

'use client';

import React, { useMemo } from 'react';
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
    handleDeleteTakeoff,
    // Handlers for detail view
    currentStep,
    setCurrentStep,
    documents,
    selectedItems,
    parsedItems,
    handleClassifyDocument,
    handleChangeDiscipline,
    handleAbridgeDocument,
    handleAbridgeAll,
    // Parsing handlers
    handleParseSchedules,
    parsingState,
    // Abridgement state
    abridgementState,
    documentAbridgementProgress,
    handleCrossItem,
    handleCrossSelected,
    handleCrossAll,
    handleToggleSelectItem,
    handleSelectAllItems,
    uploadedFiles,
    // Upload state
    uploadProgress,
    isUploading,
    // Download handlers
    handleDownloadDocument,
    handleDownloadAllDocuments,
    // Step change handler (with status update)
    handleStepChange,
    // Product cross detail data and handlers
    productCrossResults,
    selectedCrossTypes,
    productCrossState,
    handleCrossTypesChange,
    handleSelectAlternative,
    handleDeleteCrossAlternative,
    handleRerunCross,
    totalCount,
  } = state;

  // Extract unique client names from existing takeoffs for autocomplete
  const existingClients = useMemo(() => {
    const clientNames = takeoffs
      .map(t => t.metadata?.clientName)
      .filter((name): name is string => Boolean(name && typeof name === 'string'));
    return [...new Set(clientNames)].sort();
  }, [takeoffs]);

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-3 sm:p-6">
      {/* Header - only show on list view */}
      {viewMode === 'list' && (
        <>
          {/* Header Section */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)]">Take-Offs</h1>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Manage project opportunities through AI-powered takeoff workflow
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="p-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={isLoading ? 'animate-spin' : ''}
                  >
                    <path d="M23 4v6h-6"/>
                    <path d="M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                </button>

                {/* Filters */}
                <AdvancedFilters
                  filterOptions={TAKEOFF_FILTER_OPTIONS}
                  activeFilters={activeFilters}
                  onFiltersChange={setActiveFilters}
                />

                {/* Upload New Project Button */}
                <button
                  onClick={handleOpenUploadModal}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span className="hidden sm:inline">Upload New Project</span>
                  <span className="sm:hidden">Upload</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
            {/* Search Bar */}
            <div className="relative flex-1">
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
                placeholder="Search projects, companies, or locations..."
                className="w-full pl-10 pr-4 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
              />
            </div>

            {/* Clear Filters Button (if filters active) */}
            {(activeFilters.length > 0 || searchQuery) && (
              <button
                onClick={() => {
                  setActiveFilters([]);
                  setSearchQuery('');
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
                Clear Filters
              </button>
            )}
          </div>

          {/* Results Count - Shows "Showing X of Y" format */}
          {!isLoading && takeoffs.length > 0 && (
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              {totalCount > 0 && takeoffs.length !== totalCount
                ? `Showing ${takeoffs.length} of ${totalCount} projects`
                : `Showing ${takeoffs.length} project${takeoffs.length !== 1 ? 's' : ''}`}
            </p>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 md:p-6">
              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-lg font-medium text-red-800">Failed to Load Takeoffs</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <button
                    onClick={handleRefresh}
                    className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4v5h5M16 16v-5h-5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M5.05 11A7 7 0 0114.95 9M14.95 9L16 4M5.05 11L4 16" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && takeoffs.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span>Loading takeoffs...</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && takeoffs.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No Takeoffs Yet</h3>
              <p className="text-[var(--muted-foreground)] text-center max-w-md mb-6">
                Start by uploading project documents. Our AI will classify, abridge, and parse them for you.
              </p>
              <button
                onClick={handleOpenUploadModal}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload Your First Project
              </button>
            </div>
          )}

          {/* List View */}
          {!isLoading && takeoffs.length > 0 && (
            <TakeoffListView
              takeoffs={takeoffs}
              onTakeoffClick={handleSelectTakeoff}
              onDeleteTakeoff={handleDeleteTakeoff}
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
          productCrossResults={productCrossResults}
          selectedCrossTypes={selectedCrossTypes}
          isProductCrossProcessing={productCrossState.isProcessing}
          isParsingProcessing={parsingState.isProcessing}
          parsingProgress={parsingState.progress}
          isAbridgementProcessing={abridgementState.isProcessing}
          abridgementProgress={abridgementState.progress}
          documentAbridgementProgress={documentAbridgementProgress}
          onBack={handleBackToList}
          onStepChange={handleStepChange}
          onClassify={handleClassifyDocument}
          onChangeDiscipline={handleChangeDiscipline}
          onAbridge={handleAbridgeDocument}
          onAbridgeAll={handleAbridgeAll}
          onParseSchedules={handleParseSchedules}
          onViewReport={handleOpenAbridgmentReport}
          onCrossItem={handleCrossItem}
          onCrossSelected={handleCrossSelected}
          onCrossAll={handleCrossAll}
          onToggleSelect={handleToggleSelectItem}
          onSelectAll={handleSelectAllItems}
          onCreateQuote={handleCreateQuote}
          onDownloadDocument={handleDownloadDocument}
          onDownloadAllDocuments={handleDownloadAllDocuments}
          onCrossTypesChange={handleCrossTypesChange}
          onSelectAlternative={handleSelectAlternative}
          onDeleteCrossAlternative={handleDeleteCrossAlternative}
          onRerunCross={handleRerunCross}
        />
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        files={uploadedFiles}
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        existingClients={existingClients}
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
    </main>
  );
}

export default TakeoffsContent;
