'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useSubmittalsState } from './submittals/hooks/useSubmittalsState';
import { SubmittalsHeader } from './submittals/SubmittalsHeader';
import { SubmittalsList } from './submittals/SubmittalsList';
import { SubmittalsGrid } from './submittals/SubmittalsGrid';
import type { GenerateSubmittalPdfInput } from './submittals/api/useSubmittalsApi';
import type { PrintSettings } from './submittals/print-dialog/types';
import { submittalToasts } from './lib/toast';

// Dynamically import heavy components to reduce initial bundle
const SubmittalDetailPanel = dynamic(
  () => import('./submittals/SubmittalDetailPanel'),
  { ssr: false, loading: () => <div className="animate-pulse bg-[var(--muted)] h-full" /> }
);

const CreateSubmittalModal = dynamic(
  () => import('./submittals/CreateSubmittalModal'),
  { ssr: false, loading: () => <div className="animate-pulse bg-[var(--muted)] h-64 rounded-lg" /> }
);

const PrintSubmittalDialog = dynamic(
  () => import('./submittals/PrintSubmittalDialog'),
  { ssr: false, loading: () => <div className="animate-pulse bg-[var(--muted)] h-64 rounded-lg" /> }
);

export default function SubmittalsContent() {
  const {
    // State
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedSubmittalId,
    setSelectedSubmittalId,
    viewMode,
    setViewMode,
    showCreateModal,
    setShowCreateModal,
    showPrintDialog,
    setShowPrintDialog,
    isEditingItem,

    // Data
    filteredSubmittals,
    selectedSubmittalFull,
    stats,
    isLoading,
    error,

    // Loading states
    isSavingSettings,
    isAddingStakeholder,

    // Handlers
    handleSubmittalUpdate,
    handleCreateSubmittal,
    handleAddItem,
    handleDeleteItem,
    handleEditItem,
    handleRemoveItemSpecSheet,
    handleUpdateArchitect,
    handleUpdateEngineer,
    handleUpdateBidDate,
    handleAddContact,
    handleDeleteSubmittal,
    handleAddStakeholder,
    handleRemoveStakeholder,

    // PDF generation
    generatePdfMutation,

    // Refetch
    refetch,
  } = useSubmittalsState();

  // Resubmit mode state
  const [resubmitMode, setResubmitMode] = useState(false);
  const [resubmitItemIds, setResubmitItemIds] = useState<string[]>([]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
        </div>
        <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Error loading submittals</h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">{error.message}</p>
      </div>
    );
  }

  const handlePrint = async (settings: PrintSettings) => {
    if (!selectedSubmittalFull) return;

    try {
      const input: GenerateSubmittalPdfInput = {
        submittalId: selectedSubmittalFull.id,
        outputType: settings.outputType,
        includeCoverPage: settings.outputOptions.includeCoverPage,
        includeTransmittalPage: settings.outputOptions.includeTransmittalPage,
        includeFixtureSummary: settings.outputOptions.includeFixtureSummary,
        showQuantities: settings.outputOptions.showQuantities,
        showDescriptions: settings.outputOptions.showDescriptions,
        showLeadTimes: settings.outputOptions.showLeadTimes,
        useCustomerLogo: settings.outputOptions.useCustomerLogo,
        capFileSizeMb: settings.capFileSize !== 'none' ? parseInt(settings.capFileSize) : undefined,
        attachedItems: settings.transmittal.attached as string[],
        attachedOther: settings.transmittal.attachedOther || undefined,
        transmittedFor: settings.transmittal.transmittedFor as string[],
        transmittedForOther: settings.transmittal.transmittedForOther || undefined,
        copies: settings.transmittal.copies,
        selectedItemIds: settings.selectedItemIds,
        addressedToIds: settings.outputOptions.addressedTo?.map(s => s.contactId),
        createRevision: true,
      };

      const result = await generatePdfMutation.mutateAsync(input);

      if (result.success && result.pdfUrl) {
        if (result.pdfUrl.startsWith('data:')) {
          const newWindow = window.open();
          if (newWindow) {
            newWindow.document.write(`<iframe src="${result.pdfUrl}" style="width:100%;height:100%;border:none;"></iframe>`);
          }
        } else {
          window.open(result.pdfUrl, '_blank');
        }
        submittalToasts.pdfSuccess();

        // Update status based on mode
        if (resubmitMode) {
          await handleSubmittalUpdate({ status: 'resubmit_for_approval' });
        } else if (selectedSubmittalFull.status === 'draft') {
          await handleSubmittalUpdate({ status: 'for_approval' });
        }

        // Refetch to show the new revision in the Revisions tab
        refetch();
      } else if (!result.success) {
        console.error('PDF generation failed:', result.error);
        submittalToasts.pdfError(result.error);
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      submittalToasts.pdfError(err instanceof Error ? err.message : 'Unknown error');
    }
    setShowPrintDialog(false);
    setResubmitMode(false);
    setResubmitItemIds([]);
  };

  return (
    <div className="flex flex-col h-full">
      <SubmittalsHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        stats={stats}
        onCreateNew={() => setShowCreateModal(true)}
      />

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">Loading submittals...</p>
          </div>
        ) : filteredSubmittals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6M9 15l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No submittals found</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4 max-w-sm">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first submittal package to get started'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                </svg>
                New Submittal
              </button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <SubmittalsList
            submittals={filteredSubmittals}
            onSelectSubmittal={setSelectedSubmittalId}
          />
        ) : (
          <SubmittalsGrid
            submittals={filteredSubmittals}
            onSelectSubmittal={setSelectedSubmittalId}
          />
        )}
      </div>

      {/* Detail Panel */}
      {selectedSubmittalFull && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-3xl bg-[var(--background)] shadow-xl overflow-auto">
            <SubmittalDetailPanel
              submittal={selectedSubmittalFull}
              onClose={() => setSelectedSubmittalId(null)}
              onUpdate={handleSubmittalUpdate}
              onPrint={() => setShowPrintDialog(true)}
              onResubmit={(itemIds) => {
                setResubmitMode(true);
                setResubmitItemIds(itemIds);
                setShowPrintDialog(true);
              }}
              onAddItem={handleAddItem}
              onDeleteItem={handleDeleteItem}
              onEditItem={handleEditItem}
              onRemoveItemSpecSheet={handleRemoveItemSpecSheet}
              isEditingItem={isEditingItem}
              onUpdateArchitect={handleUpdateArchitect}
              onUpdateEngineer={handleUpdateEngineer}
              onUpdateBidDate={handleUpdateBidDate}
              onDeleteSubmittal={handleDeleteSubmittal}
              onAddStakeholder={handleAddStakeholder}
              onRemoveStakeholder={handleRemoveStakeholder}
              isSavingSettings={isSavingSettings}
              isAddingStakeholder={isAddingStakeholder}
            />
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateSubmittalModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateSubmittal}
        />
      )}

      {/* Print Dialog */}
      {showPrintDialog && selectedSubmittalFull && (
        <PrintSubmittalDialog
          submittal={selectedSubmittalFull}
          onClose={() => {
            setShowPrintDialog(false);
            setResubmitMode(false);
            setResubmitItemIds([]);
          }}
          onPrint={handlePrint}
          onAddContact={handleAddContact}
          resubmitMode={resubmitMode}
          resubmitItemIds={resubmitItemIds}
        />
      )}
    </div>
  );
}
