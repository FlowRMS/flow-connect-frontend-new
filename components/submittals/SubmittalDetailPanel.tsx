'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type {
  Submittal,
  SpecSheetMatchStatus,
  SubmittalConfig,
  SpecSheet,
} from '../../lib/types/submittals';
import { defaultSubmittalConfig } from '../../lib/types/submittals';
import {
  useSpecSheetSearchWithFactoryNames,
  useManufacturersWithSpecSheets,
  useHighlightVersions,
} from './api/useSpecSheetsApi';
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
import { useRevisionWorkflow } from './hooks/useRevisionWorkflow';
import { useSubmittalSettings, StakeholdersTabContent } from './submittal-detail';
import SpecSheetUploadModal from './SpecSheetUploadModal';

interface SubmittalDetailPanelProps {
  submittal: Submittal;
  onClose: () => void;
  onUpdate?: (updates: Partial<Submittal>) => void;
  onPrint?: () => void;
  onResubmit?: (itemsToResubmit: string[]) => void;
  onAddItem?: () => void;
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (itemId: string, values: { description?: string; quantity?: number }) => void;
  isEditingItem?: boolean;
  onUpdateArchitect?: (name: string) => void;
  onUpdateEngineer?: (name: string) => void;
  onUpdateBidDate?: (date: string) => void;
  onDeleteSubmittal?: () => void;
}

type TabId = 'items' | 'stakeholders' | 'revisions' | 'settings';

export default function SubmittalDetailPanel({
  submittal,
  onClose,
  onUpdate,
  onPrint,
  onResubmit,
  onAddItem,
  onDeleteItem,
  onEditItem,
  isEditingItem,
  onUpdateArchitect,
  onUpdateEngineer,
  onUpdateBidDate,
  onDeleteSubmittal,
}: SubmittalDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('items');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showSpecSheetPicker, setShowSpecSheetPicker] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [specSheetSearch, setSpecSheetSearch] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SubmittalConfig>(
    submittal.config || { ...defaultSubmittalConfig }
  );

  // Revision workflow hook
  const {
    emailDialogRevision,
    setEmailDialogRevision,
    uploadDialogRevision,
    setUploadDialogRevision,
    analysisReturnedPdf,
    setAnalysisReturnedPdf,
    handleSendEmail,
    handleUploadReturned,
    handleUpdateChange,
    handleAddChange,
    handleDeleteChange,
    handleResubmit,
  } = useRevisionWorkflow({ submittal, onUpdate, onResubmit });

  // Settings hook
  const settings = useSubmittalSettings({ submittal, onUpdate });

  // Spec sheet picker state
  const [specSheetManufacturerId, setSpecSheetManufacturerId] = useState<string | null>(null);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [selectedSpecSheetForHighlight, setSelectedSpecSheetForHighlight] = useState<string | null>(null);

  // API hooks for spec sheets
  const { data: manufacturers = [], isLoading: isLoadingManufacturers } = useManufacturersWithSpecSheets();
  const { data: specSheetsFromApi, isLoading: isLoadingSpecSheets } = useSpecSheetSearchWithFactoryNames({
    factoryId: specSheetManufacturerId || undefined,
    searchTerm: specSheetSearch || undefined,
    publishedOnly: false,
    limit: 50,
  }, showSpecSheetPicker);

  // Get highlight versions for the selected item's spec sheet
  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return submittal.items.find(i => i.id === selectedItemId) || null;
  }, [selectedItemId, submittal.items]);

  const { data: highlightVersions = [], isLoading: isLoadingHighlightVersions } = useHighlightVersions(
    selectedSpecSheetForHighlight || selectedItem?.specSheetId || null
  );

  // Auto-select first manufacturer when picker opens
  useEffect(() => {
    if (showSpecSheetPicker && !specSheetManufacturerId && manufacturers.length > 0) {
      setSpecSheetManufacturerId(manufacturers[0].id);
    }
  }, [showSpecSheetPicker, specSheetManufacturerId, manufacturers]);

  const updateEditingConfig = (key: keyof SubmittalConfig, value: boolean) => {
    setEditingConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = () => {
    onUpdate?.({ config: editingConfig });
    setShowConfigModal(false);
  };

  // Stats for the submittal
  const stats = useMemo(() => {
    const total = submittal.items.length;
    const ready = submittal.items.filter(i => i.matchStatus === 'matched_with_highlight').length;
    const needsHighlight = submittal.items.filter(i => i.matchStatus === 'matched_no_highlight').length;
    const missing = submittal.items.filter(i => i.matchStatus === 'no_match').length;
    return { total, ready, needsHighlight, missing };
  }, [submittal.items]);

  // Spec sheets from API (already filtered by search and manufacturer)
  const filteredSpecSheets: SpecSheet[] = specSheetsFromApi || [];

  // Matching spec sheet for selected item (from API data or search results)
  const selectedItemSpecSheet = useMemo(() => {
    if (!selectedItem?.specSheetId) return null;
    // First, try to use the spec sheet data that comes with the item from the API
    if (selectedItem.specSheet) {
      return selectedItem.specSheet as SpecSheet;
    }
    // Fallback to searching in filtered spec sheets (from picker)
    const fromCurrent = filteredSpecSheets.find(s => s.id === selectedItem.specSheetId);
    if (fromCurrent) return fromCurrent;
    return null;
  }, [selectedItem?.specSheetId, selectedItem?.specSheet, filteredSpecSheets]);

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'items', label: 'Items', count: submittal.items.length },
    { id: 'stakeholders', label: 'Stakeholders' },
    { id: 'revisions', label: 'Revisions', count: submittal.revisions.length },
    { id: 'settings', label: 'Settings' },
  ];

  const handleAttachSpecSheet = (specSheetId: string) => {
    if (!selectedItemId || !onUpdate) return;

    const updatedItems = submittal.items.map(item => {
      if (item.id === selectedItemId) {
        return {
          ...item,
          specSheetId,
          matchStatus: 'matched_no_highlight' as SpecSheetMatchStatus,
        };
      }
      return item;
    });

    onUpdate({ items: updatedItems });
    setShowSpecSheetPicker(false);
    setSelectedSpecSheetForHighlight(specSheetId);
    setShowHighlightPicker(true);
  };

  const handleAttachHighlightVersion = (highlightVersionId: string) => {
    if (!selectedItemId || !onUpdate) return;

    const updatedItems = submittal.items.map(item => {
      if (item.id === selectedItemId) {
        return {
          ...item,
          highlightDefinitionId: highlightVersionId,
          matchStatus: 'matched_with_highlight' as SpecSheetMatchStatus,
        };
      }
      return item;
    });

    onUpdate({ items: updatedItems });
    setShowHighlightPicker(false);
    setSelectedSpecSheetForHighlight(null);
  };

  const handleSkipHighlightVersion = () => {
    setShowHighlightPicker(false);
    setSelectedSpecSheetForHighlight(null);
  };

  const handleRemoveSpecSheet = (itemId: string) => {
    if (!onUpdate) return;

    const updatedItems = submittal.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          specSheetId: undefined,
          highlightDefinitionId: undefined,
          matchStatus: 'no_match' as SpecSheetMatchStatus,
        };
      }
      return item;
    });

    onUpdate({ items: updatedItems });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg shadow-2xl w-[95vw] h-[95vh] max-w-[1400px] flex flex-col overflow-hidden">
        <SubmittalDetailHeader
          submittal={submittal}
          onOpenConfig={() => {
            setEditingConfig(submittal.config || { ...defaultSubmittalConfig });
            setShowConfigModal(true);
          }}
          onPrint={onPrint}
          onClose={onClose}
        />

        <SubmittalMetaPanel
          submittal={submittal}
          stats={stats}
          onUpdateArchitect={onUpdateArchitect}
          onUpdateEngineer={onUpdateEngineer}
          onUpdateBidDate={onUpdateBidDate}
        />

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
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
          {activeTab === 'items' && (
            <ItemsTabContent
              items={submittal.items}
              selectedItemId={selectedItemId}
              setSelectedItemId={setSelectedItemId}
              selectedItem={selectedItem}
              selectedItemSpecSheet={selectedItemSpecSheet}
              onBrowseLibrary={() => setShowSpecSheetPicker(true)}
              onRemoveSpecSheet={handleRemoveSpecSheet}
              onAddItem={onAddItem}
              onDeleteItem={onDeleteItem}
              onEditItem={onEditItem}
              isEditingItem={isEditingItem}
              onUploadNew={() => setShowUploadModal(true)}
            />
          )}

          {activeTab === 'stakeholders' && (
            <StakeholdersTabContent
              customers={submittal.customers}
              engineers={submittal.engineers}
              architects={submittal.architects}
            />
          )}

          {activeTab === 'revisions' && (
            <div className="flex-1 overflow-y-auto p-6">
              <RevisionTimeline
                submittal={submittal}
                onSendEmail={(revision) => setEmailDialogRevision(revision)}
                onUploadReturned={(revision) => setUploadDialogRevision(revision)}
                onViewPdf={(url, name) => {
                  console.log('View PDF:', url, name);
                  window.open(url, '_blank');
                }}
                onResubmit={(revision, returnedPdf) => handleResubmit(revision, returnedPdf)}
                onViewAnalysis={(returnedPdf) => setAnalysisReturnedPdf(returnedPdf)}
              />
            </div>
          )}

          {activeTab === 'settings' && (
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
            />
          )}
        </div>

        <SpecSheetPickerModal
          isOpen={showSpecSheetPicker}
          onClose={() => setShowSpecSheetPicker(false)}
          specSheetSearch={specSheetSearch}
          setSpecSheetSearch={setSpecSheetSearch}
          specSheetManufacturerId={specSheetManufacturerId}
          setSpecSheetManufacturerId={setSpecSheetManufacturerId}
          manufacturers={manufacturers}
          isLoadingManufacturers={isLoadingManufacturers}
          filteredSpecSheets={filteredSpecSheets}
          isLoadingSpecSheets={isLoadingSpecSheets}
          onSelectSpecSheet={handleAttachSpecSheet}
        />

        <HighlightVersionPickerModal
          isOpen={showHighlightPicker}
          onClose={handleSkipHighlightVersion}
          highlightVersions={highlightVersions}
          isLoading={isLoadingHighlightVersions}
          onSelectVersion={handleAttachHighlightVersion}
          onSkip={handleSkipHighlightVersion}
        />

        {showConfigModal && (
          <SubmittalConfigModal
            editingConfig={editingConfig}
            updateEditingConfig={updateEditingConfig}
            onSave={handleSaveConfig}
            onClose={() => setShowConfigModal(false)}
          />
        )}

        {emailDialogRevision && (
          <SendSubmittalEmailDialog
            submittal={submittal}
            revision={emailDialogRevision}
            onClose={() => setEmailDialogRevision(null)}
            onSend={handleSendEmail}
            onSkip={() => setEmailDialogRevision(null)}
          />
        )}

        {uploadDialogRevision && (
          <ReturnedPdfUpload
            submittal={submittal}
            revision={uploadDialogRevision}
            onClose={() => setUploadDialogRevision(null)}
            onUpload={handleUploadReturned}
          />
        )}

        {analysisReturnedPdf && (
          <ChangeAnalysisPanel
            returnedPdf={analysisReturnedPdf}
            submittalItems={submittal.items}
            onClose={() => setAnalysisReturnedPdf(null)}
            onResubmit={() => {
              const revision = submittal.revisions.find(r =>
                r.returnedPdfs.some(p => p.id === analysisReturnedPdf.id)
              );
              if (revision) {
                handleResubmit(revision, analysisReturnedPdf);
              }
              setAnalysisReturnedPdf(null);
            }}
            onUpdateChange={handleUpdateChange}
            onAddChange={handleAddChange}
            onDeleteChange={handleDeleteChange}
          />
        )}

        {showUploadModal && (
          <SpecSheetUploadModal
            onClose={() => setShowUploadModal(false)}
            onSuccess={() => {
              setShowUploadModal(false);
              // After upload, open the spec sheet picker to select the newly uploaded sheet
              setShowSpecSheetPicker(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
