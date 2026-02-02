'use client';

import React from 'react';
import type {
  Submittal,
  SubmittalStatus,
} from '../../lib/types/submittals';
import RevisionTimeline from './RevisionTimeline';
import SendSubmittalEmailDialog from './SendSubmittalEmailDialog';
import ReturnedPdfUpload from './ReturnedPdfUpload';
import ChangeAnalysisPanel from './ChangeAnalysisPanel';
import { SubmittalConfigModal } from './SubmittalConfigModal';
import { SpecSheetPickerModal } from './SpecSheetPickerModal';
import { HighlightVersionPickerModal } from './HighlightVersionPickerModal';
import { SubmittalDetailHeader } from './SubmittalDetailHeader';
import { SubmittalMetaPanel } from './SubmittalMetaPanel';
import { ItemsTabContent } from './ItemsTabContent';
import { SubmittalSettingsTab } from './SubmittalSettingsTab';
import { StakeholdersTabContent } from './submittal-detail';
import SpecSheetUploadModal from './SpecSheetUploadModal';
import { useSubmittalDetailPanel, type TabId } from './hooks/useSubmittalDetailPanel';

interface SubmittalDetailPanelProps {
  submittal: Submittal;
  onClose: () => void;
  onUpdate?: (updates: Partial<Submittal>) => void;
  onPrint?: () => void;
  onResubmit?: (itemsToResubmit: string[]) => void;
  onAddItem?: () => void;
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (itemId: string, values: { description?: string; quantity?: number }) => void;
  onRemoveItemSpecSheet?: (itemId: string) => void;
  isEditingItem?: boolean;
  onUpdateArchitect?: (name: string) => void;
  onUpdateEngineer?: (name: string) => void;
  onUpdateBidDate?: (date: string) => void;
  onApplyStatus?: (status: SubmittalStatus) => void | Promise<void>;
  onDeleteSubmittal?: () => void;
  onAddStakeholder?: (role: 'customer' | 'engineer' | 'architect', data: { contactName: string; companyName: string; email: string }) => Promise<void>;
  onRemoveStakeholder?: (stakeholderId: string) => void;
  isSavingSettings?: boolean;
  isAddingStakeholder?: boolean;
  forceActiveTab?: TabId | null;
  onTabChanged?: () => void;
}

export default function SubmittalDetailPanel({
  submittal,
  onClose,
  onUpdate,
  onPrint,
  onResubmit,
  onAddItem,
  onDeleteItem,
  onEditItem,
  onRemoveItemSpecSheet,
  isEditingItem,
  onUpdateArchitect,
  onUpdateEngineer,
  onUpdateBidDate,
  onApplyStatus,
  onDeleteSubmittal,
  onAddStakeholder,
  onRemoveStakeholder,
  isSavingSettings,
  isAddingStakeholder,
  forceActiveTab,
  onTabChanged,
}: SubmittalDetailPanelProps) {
  const panel = useSubmittalDetailPanel({
    submittal,
    onUpdate,
    onResubmit,
    forceActiveTab,
    onTabChanged,
  });

  const { revisionWorkflow, settings, specSheetHandlers } = panel;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg shadow-2xl w-[95vw] h-[95vh] max-w-[1400px] flex flex-col overflow-hidden">
        <SubmittalDetailHeader
          submittal={submittal}
          onOpenConfig={panel.handleOpenConfig}
          onPrint={onPrint}
          onClose={onClose}
        />

        <SubmittalMetaPanel
          submittal={submittal}
          stats={panel.stats}
          onUpdateArchitect={onUpdateArchitect}
          onUpdateEngineer={onUpdateEngineer}
          onUpdateBidDate={onUpdateBidDate}
        />

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)]">
          {panel.tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => panel.setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                panel.activeTab === tab.id
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 text-xs text-[var(--muted-foreground)]">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {panel.activeTab === 'items' && (
            <ItemsTabContent
              items={submittal.items}
              selectedItemId={panel.selectedItemId}
              setSelectedItemId={panel.setSelectedItemId}
              selectedItem={panel.selectedItem}
              selectedItemSpecSheet={panel.selectedItemSpecSheet}
              onBrowseLibrary={() => panel.setShowSpecSheetPicker(true)}
              onRemoveSpecSheet={onRemoveItemSpecSheet || specSheetHandlers.handleRemoveSpecSheet}
              onEditHighlights={() => specSheetHandlers.handleEditHighlights(panel.selectedItem?.specSheetId)}
              onAddItem={onAddItem}
              onDeleteItem={onDeleteItem}
              onEditItem={onEditItem}
              isEditingItem={isEditingItem}
              onUploadNew={() => panel.setShowUploadModal(true)}
            />
          )}

          {panel.activeTab === 'stakeholders' && (
            <StakeholdersTabContent
              customers={submittal.customers}
              engineers={submittal.engineers}
              architects={submittal.architects}
              onAddStakeholder={onAddStakeholder}
              onRemoveStakeholder={onRemoveStakeholder}
              isAddingStakeholder={isAddingStakeholder}
            />
          )}

          {panel.activeTab === 'revisions' && (
            <div className="flex-1 overflow-y-auto p-6">
              <RevisionTimeline
                submittal={submittal}
                onSendEmail={(revision) => revisionWorkflow.setEmailDialogRevision(revision)}
                onUploadReturned={(revision) => revisionWorkflow.setUploadDialogRevision(revision)}
                onViewPdf={(url, name) => {
                  console.log('View PDF:', url, name);
                  window.open(url, '_blank');
                }}
                onResubmit={(revision, returnedPdf) => revisionWorkflow.handleResubmit(revision, returnedPdf)}
                onViewAnalysis={(returnedPdf) => revisionWorkflow.setAnalysisReturnedPdf(returnedPdf)}
              />
            </div>
          )}

          {panel.activeTab === 'settings' && (
            <SubmittalSettingsTab
              editingJobName={settings.editingJobName}
              setEditingJobName={settings.setEditingJobName}
              editingJobLocation={settings.editingJobLocation}
              setEditingJobLocation={settings.setEditingJobLocation}
              editingBidDate={settings.editingBidDate}
              setEditingBidDate={settings.setEditingBidDate}
              editingTags={settings.editingTags}
              newTagInput={settings.newTagInput}
              setNewTagInput={settings.setNewTagInput}
              onAddTag={settings.handleAddTag}
              onRemoveTag={settings.handleRemoveTag}
              hasSettingsChanges={settings.hasSettingsChanges}
              onSaveSettings={settings.handleSaveSettings}
              onDeleteSubmittal={onDeleteSubmittal}
              isSaving={isSavingSettings}
            />
          )}
        </div>

        <SpecSheetPickerModal
          isOpen={panel.showSpecSheetPicker}
          onClose={() => panel.setShowSpecSheetPicker(false)}
          specSheetSearch={panel.specSheetSearch}
          setSpecSheetSearch={panel.setSpecSheetSearch}
          specSheetManufacturerId={panel.specSheetManufacturerId}
          setSpecSheetManufacturerId={panel.setSpecSheetManufacturerId}
          manufacturers={panel.manufacturers}
          isLoadingManufacturers={panel.isLoadingManufacturers}
          filteredSpecSheets={panel.filteredSpecSheets}
          isLoadingSpecSheets={panel.isLoadingSpecSheets}
          onSelectSpecSheet={specSheetHandlers.handleAttachSpecSheet}
        />

        <HighlightVersionPickerModal
          isOpen={panel.showHighlightPicker}
          onClose={specSheetHandlers.handleSkipHighlightVersion}
          highlightVersions={panel.highlightVersions}
          isLoading={panel.isLoadingHighlightVersions}
          onSelectVersion={specSheetHandlers.handleAttachHighlightVersion}
          onSkip={specSheetHandlers.handleSkipHighlightVersion}
        />

        {panel.showConfigModal && (
          <SubmittalConfigModal
            editingConfig={panel.editingConfig}
            updateEditingConfig={panel.updateEditingConfig}
            onSave={panel.handleSaveConfig}
            onClose={() => panel.setShowConfigModal(false)}
          />
        )}

        {revisionWorkflow.emailDialogRevision && (
          <SendSubmittalEmailDialog
            submittal={submittal}
            revision={revisionWorkflow.emailDialogRevision}
            onClose={() => revisionWorkflow.setEmailDialogRevision(null)}
            onSend={revisionWorkflow.handleSendEmail}
            onSkip={() => revisionWorkflow.setEmailDialogRevision(null)}
          />
        )}

        {revisionWorkflow.uploadDialogRevision && (
          <ReturnedPdfUpload
            submittal={submittal}
            revision={revisionWorkflow.uploadDialogRevision}
            onClose={() => revisionWorkflow.setUploadDialogRevision(null)}
            onSuccess={(returnedPdf) => {
              if (onUpdate) {
                const updatedRevisions = submittal.revisions.map(rev => {
                  if (rev.revisionNumber === revisionWorkflow.uploadDialogRevision?.revisionNumber) {
                    return { ...rev, returnedPdfs: [...rev.returnedPdfs, returnedPdf] };
                  }
                  return rev;
                });
                onUpdate({ revisions: updatedRevisions });
              }
              revisionWorkflow.setUploadDialogRevision(null);
              if (returnedPdf.changeAnalysis) {
                revisionWorkflow.setAnalysisReturnedPdf(returnedPdf);
              }
            }}
          />
        )}

        {revisionWorkflow.analysisReturnedPdf && (
          <ChangeAnalysisPanel
            returnedPdf={revisionWorkflow.analysisReturnedPdf}
            submittalItems={submittal.items}
            onClose={() => revisionWorkflow.setAnalysisReturnedPdf(null)}
            onResubmit={() => {
              const revision = submittal.revisions.find(r =>
                r.returnedPdfs.some(p => p.id === revisionWorkflow.analysisReturnedPdf?.id)
              );
              if (revision && revisionWorkflow.analysisReturnedPdf) {
                revisionWorkflow.handleResubmit(revision, revisionWorkflow.analysisReturnedPdf);
              }
              revisionWorkflow.setAnalysisReturnedPdf(null);
            }}
            onApplyStatus={async (status) => {
              await onApplyStatus?.(status);
              revisionWorkflow.setAnalysisReturnedPdf(null);
            }}
            onUpdateChange={revisionWorkflow.handleUpdateChange}
            onAddChange={revisionWorkflow.handleAddChange}
            onDeleteChange={revisionWorkflow.handleDeleteChange}
          />
        )}

        {panel.showUploadModal && (
          <SpecSheetUploadModal
            onClose={() => panel.setShowUploadModal(false)}
            onSuccess={() => {
              panel.setShowUploadModal(false);
              panel.setShowSpecSheetPicker(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
