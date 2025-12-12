'use client';

import React, { useState, useMemo } from 'react';
import type {
  Submittal,
  SubmittalItem,
  SubmittalStakeholder,
  SpecSheetMatchStatus,
  SubmittalConfig,
  SubmittalRevision,
  ReturnedPdf,
  EmailSendRecord,
  ItemChange,
} from '../../lib/types/submittals';
import { defaultSubmittalConfig } from '../../lib/types/submittals';
import {
  mockSpecSheets,
  submittalStatusLabels,
  submittalStatusColors,
  matchStatusLabels,
  matchStatusColors,
} from '../../lib/data/submittals-mock';
import RevisionTimeline from './RevisionTimeline';
import SendSubmittalEmailDialog from './SendSubmittalEmailDialog';
import ReturnedPdfUpload from './ReturnedPdfUpload';
import ChangeAnalysisPanel from './ChangeAnalysisPanel';

interface SubmittalDetailPanelProps {
  submittal: Submittal;
  onClose: () => void;
  onUpdate?: (updates: Partial<Submittal>) => void;
  onPrint?: () => void;
  onResubmit?: (itemsToResubmit: string[]) => void;
}

type TabId = 'items' | 'stakeholders' | 'revisions' | 'settings';

export default function SubmittalDetailPanel({
  submittal,
  onClose,
  onUpdate,
  onPrint,
  onResubmit,
}: SubmittalDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('items');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showSpecSheetPicker, setShowSpecSheetPicker] = useState(false);
  const [specSheetSearch, setSpecSheetSearch] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SubmittalConfig>(
    submittal.config || { ...defaultSubmittalConfig }
  );

  // Revision workflow state
  const [emailDialogRevision, setEmailDialogRevision] = useState<SubmittalRevision | null>(null);
  const [uploadDialogRevision, setUploadDialogRevision] = useState<SubmittalRevision | null>(null);
  const [analysisReturnedPdf, setAnalysisReturnedPdf] = useState<ReturnedPdf | null>(null);

  const updateEditingConfig = (key: keyof SubmittalConfig, value: boolean) => {
    setEditingConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = () => {
    onUpdate?.({ config: editingConfig });
    setShowConfigModal(false);
  };

  // Revision workflow handlers
  const handleSendEmail = (emailRecord: Omit<EmailSendRecord, 'id' | 'sentAt'>) => {
    if (!emailDialogRevision || !onUpdate) return;

    const newEmailRecord: EmailSendRecord = {
      ...emailRecord,
      id: `email-${Date.now()}`,
      sentAt: new Date().toISOString(),
    };

    const updatedRevisions = submittal.revisions.map(rev => {
      if (rev.revisionNumber === emailDialogRevision.revisionNumber) {
        return {
          ...rev,
          emailsSent: [...(rev.emailsSent || []), newEmailRecord],
        };
      }
      return rev;
    });

    onUpdate({ revisions: updatedRevisions });
    setEmailDialogRevision(null);
  };

  const handleUploadReturned = (returnedPdf: Omit<ReturnedPdf, 'id' | 'uploadedAt' | 'uploadedBy'>) => {
    if (!uploadDialogRevision || !onUpdate) return;

    const newReturnedPdf: ReturnedPdf = {
      ...returnedPdf,
      id: `ret-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Current User', // Would come from auth context
    };

    const updatedRevisions = submittal.revisions.map(rev => {
      if (rev.revisionNumber === uploadDialogRevision.revisionNumber) {
        return {
          ...rev,
          returnedPdfs: [...rev.returnedPdfs, newReturnedPdf],
        };
      }
      return rev;
    });

    onUpdate({ revisions: updatedRevisions });
    setUploadDialogRevision(null);

    // If there's change analysis, show the panel
    if (newReturnedPdf.changeAnalysis) {
      setAnalysisReturnedPdf(newReturnedPdf);
    }
  };

  const handleUpdateChange = (changeId: string, updates: Partial<ItemChange>) => {
    if (!analysisReturnedPdf || !onUpdate) return;

    const updatedRevisions = submittal.revisions.map(rev => ({
      ...rev,
      returnedPdfs: rev.returnedPdfs.map(pdf => {
        if (pdf.id === analysisReturnedPdf.id && pdf.changeAnalysis) {
          return {
            ...pdf,
            changeAnalysis: {
              ...pdf.changeAnalysis,
              itemChanges: pdf.changeAnalysis.itemChanges.map(change =>
                change.id === changeId ? { ...change, ...updates } : change
              ),
            },
          };
        }
        return pdf;
      }),
    }));

    onUpdate({ revisions: updatedRevisions });

    // Update local state
    if (analysisReturnedPdf.changeAnalysis) {
      setAnalysisReturnedPdf({
        ...analysisReturnedPdf,
        changeAnalysis: {
          ...analysisReturnedPdf.changeAnalysis,
          itemChanges: analysisReturnedPdf.changeAnalysis.itemChanges.map(change =>
            change.id === changeId ? { ...change, ...updates } : change
          ),
        },
      });
    }
  };

  const handleAddChange = (change: Omit<ItemChange, 'id'>) => {
    if (!analysisReturnedPdf || !analysisReturnedPdf.changeAnalysis || !onUpdate) return;

    const newChange: ItemChange = {
      ...change,
      id: `ic-${Date.now()}`,
    };

    const updatedRevisions = submittal.revisions.map(rev => ({
      ...rev,
      returnedPdfs: rev.returnedPdfs.map(pdf => {
        if (pdf.id === analysisReturnedPdf.id && pdf.changeAnalysis) {
          return {
            ...pdf,
            changeAnalysis: {
              ...pdf.changeAnalysis,
              totalChangesDetected: pdf.changeAnalysis.totalChangesDetected + 1,
              itemChanges: [...pdf.changeAnalysis.itemChanges, newChange],
            },
          };
        }
        return pdf;
      }),
    }));

    onUpdate({ revisions: updatedRevisions });

    // Update local state
    setAnalysisReturnedPdf({
      ...analysisReturnedPdf,
      changeAnalysis: {
        ...analysisReturnedPdf.changeAnalysis,
        totalChangesDetected: analysisReturnedPdf.changeAnalysis.totalChangesDetected + 1,
        itemChanges: [...analysisReturnedPdf.changeAnalysis.itemChanges, newChange],
      },
    });
  };

  const handleDeleteChange = (changeId: string) => {
    if (!analysisReturnedPdf || !analysisReturnedPdf.changeAnalysis || !onUpdate) return;

    const updatedRevisions = submittal.revisions.map(rev => ({
      ...rev,
      returnedPdfs: rev.returnedPdfs.map(pdf => {
        if (pdf.id === analysisReturnedPdf.id && pdf.changeAnalysis) {
          return {
            ...pdf,
            changeAnalysis: {
              ...pdf.changeAnalysis,
              totalChangesDetected: Math.max(0, pdf.changeAnalysis.totalChangesDetected - 1),
              itemChanges: pdf.changeAnalysis.itemChanges.filter(c => c.id !== changeId),
            },
          };
        }
        return pdf;
      }),
    }));

    onUpdate({ revisions: updatedRevisions });

    // Update local state
    setAnalysisReturnedPdf({
      ...analysisReturnedPdf,
      changeAnalysis: {
        ...analysisReturnedPdf.changeAnalysis,
        totalChangesDetected: Math.max(0, analysisReturnedPdf.changeAnalysis.totalChangesDetected - 1),
        itemChanges: analysisReturnedPdf.changeAnalysis.itemChanges.filter(c => c.id !== changeId),
      },
    });
  };

  const handleResubmit = (revision: SubmittalRevision, returnedPdf: ReturnedPdf) => {
    if (!returnedPdf.changeAnalysis || !onResubmit) return;

    // Get item IDs that need to be resubmitted
    const itemsToResubmit = returnedPdf.changeAnalysis.itemChanges
      .filter(c => c.status === 'revise' || c.status === 'rejected')
      .map(c => c.itemId);

    onResubmit(itemsToResubmit);
  };

  // Stats for the submittal
  const stats = useMemo(() => {
    const total = submittal.items.length;
    const ready = submittal.items.filter(i => i.matchStatus === 'matched_with_highlight').length;
    const needsHighlight = submittal.items.filter(i => i.matchStatus === 'matched_no_highlight').length;
    const missing = submittal.items.filter(i => i.matchStatus === 'no_match').length;
    return { total, ready, needsHighlight, missing };
  }, [submittal.items]);

  // Filtered spec sheets for picker
  const filteredSpecSheets = useMemo(() => {
    if (!specSheetSearch) return mockSpecSheets;
    const search = specSheetSearch.toLowerCase();
    return mockSpecSheets.filter(s =>
      s.displayName.toLowerCase().includes(search) ||
      s.manufacturer.toLowerCase().includes(search) ||
      s.fileName.toLowerCase().includes(search)
    );
  }, [specSheetSearch]);

  // Selected item details
  const selectedItem = selectedItemId
    ? submittal.items.find(i => i.id === selectedItemId)
    : null;

  // Matching spec sheet for selected item
  const selectedItemSpecSheet = selectedItem?.specSheetId
    ? mockSpecSheets.find(s => s.id === selectedItem.specSheetId)
    : null;

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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">{submittal.jobName}</h2>
                <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${submittalStatusColors[submittal.status].bg} ${submittalStatusColors[submittal.status].text}`}>
                  {submittalStatusLabels[submittal.status]}
                </span>
                {submittal.currentRevision > 0 && (
                  <span className="text-sm text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded">
                    Rev {submittal.currentRevision}
                  </span>
                )}
              </div>
              {submittal.jobLocation && (
                <p className="text-sm text-[var(--muted-foreground)] mt-1">{submittal.jobLocation}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingConfig(submittal.config || { ...defaultSubmittalConfig });
                setShowConfigModal(true);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              title="Submittal Configuration"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
              Configure
            </button>
            <button
              onClick={onPrint}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 16v2a2 2 0 002 2h8a2 2 0 002-2v-2M10 4v10M6 10l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Print
            </button>
            <button
              onClick={onPrint}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6M9 15l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Generate Submittal
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Submittal Meta Information Panel */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/20">
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Submittal Info */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Submittal</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <label className="text-[10px] text-[var(--muted-foreground)]">Project:</label>
                  <p className="text-sm font-medium text-[var(--foreground)]">{submittal.jobName}</p>
                </div>
                <div>
                  <label className="text-[10px] text-[var(--muted-foreground)]">Location:</label>
                  <p className="text-sm text-[var(--foreground)]">{submittal.jobLocation || '-'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-[var(--muted-foreground)]">Submitted On:</label>
                  <p className="text-sm text-[var(--foreground)]">
                    {submittal.submittalDate ? new Date(submittal.submittalDate).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-[var(--muted-foreground)]">Submitted By:</label>
                  <p className="text-sm text-[var(--foreground)]">{submittal.createdBy || '-'}</p>
                </div>
              </div>
            </div>

            {/* Middle Column - Letters (Architect/Engineer) */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Letters</div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <label className="text-[10px] text-[var(--muted-foreground)] w-16">Architect:</label>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      defaultValue={submittal.architects[0]?.contactName || ''}
                      placeholder="Enter architect..."
                      className="flex-1 px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                    />
                    <button className="p-1 hover:bg-[var(--muted)] rounded text-[var(--muted-foreground)]" title="Browse contacts">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-[10px] text-[var(--muted-foreground)] w-16">Engineer:</label>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      defaultValue={submittal.engineers[0]?.contactName || ''}
                      placeholder="Enter engineer..."
                      className="flex-1 px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                    />
                    <button className="p-1 hover:bg-[var(--muted)] rounded text-[var(--muted-foreground)]" title="Browse contacts">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Dates */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Dates</div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <label className="text-[10px] text-[var(--muted-foreground)] w-16">Bid Date:</label>
                  <input
                    type="date"
                    defaultValue={submittal.bidDate?.split('T')[0] || ''}
                    className="flex-1 px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                  />
                </div>
                <div className="text-xs text-[var(--muted-foreground)] space-y-1 pt-1">
                  <p>Created: {new Date(submittal.createdAt).toLocaleString()} by {submittal.createdBy}</p>
                  <p>Updated: {new Date(submittal.updatedAt).toLocaleString()} by {submittal.updatedBy}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-[var(--muted-foreground)]">Completion Progress</span>
                <span className="font-medium text-[var(--foreground)]">
                  {Math.round((stats.ready / stats.total) * 100)}% ready
                </span>
              </div>
              <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden flex">
                <div
                  className="bg-green-500 transition-all"
                  style={{ width: `${(stats.ready / stats.total) * 100}%` }}
                />
                <div
                  className="bg-yellow-500 transition-all"
                  style={{ width: `${(stats.needsHighlight / stats.total) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                <span className="text-[var(--muted-foreground)]">{stats.ready} ready</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                <span className="text-[var(--muted-foreground)]">{stats.needsHighlight} need highlights</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="text-[var(--muted-foreground)]">{stats.missing} missing spec sheets</span>
              </span>
            </div>
          </div>
        </div>

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
          {/* Items Tab */}
          {activeTab === 'items' && (
            <>
              {/* Items List */}
              <div className="w-80 border-r border-[var(--border)] flex flex-col">
                <div className="p-3 border-b border-[var(--border)]">
                  <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-dashed border-[var(--border)] rounded-lg text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                    </svg>
                    Add Item
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {submittal.items.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`px-4 py-3 border-b border-[var(--border)] cursor-pointer transition-colors ${
                        selectedItemId === item.id
                          ? 'bg-[var(--primary)]/5 border-l-2 border-l-[var(--primary)]'
                          : 'hover:bg-[var(--muted)]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--foreground)]">{item.fixtureType}</span>
                          <span className={`w-2 h-2 rounded-full ${
                            item.matchStatus === 'matched_with_highlight' ? 'bg-green-500' :
                            item.matchStatus === 'matched_no_highlight' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)]">#{index + 1}</span>
                      </div>
                      <p className="text-sm text-[var(--foreground)] truncate">{item.catalogNumber}</p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">{item.manufacturer}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Item Detail */}
              <div className="flex-1 overflow-y-auto">
                {selectedItem ? (
                  <div className="p-6">
                    {/* Item Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-2xl font-semibold text-[var(--foreground)]">{selectedItem.fixtureType}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${matchStatusColors[selectedItem.matchStatus].bg} ${matchStatusColors[selectedItem.matchStatus].text}`}>
                            {matchStatusLabels[selectedItem.matchStatus]}
                          </span>
                        </div>
                        <h3 className="text-lg font-medium text-[var(--foreground)]">{selectedItem.catalogNumber}</h3>
                        <p className="text-sm text-[var(--muted-foreground)]">{selectedItem.manufacturer}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)]">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18.5 2.5a2.121 2.121 0 010 3L12 12l-4 1 1-4 6.5-6.5a2.121 2.121 0 013 0z" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h14M8 6V4h4v2M17 6v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                        <span className="text-xs text-[var(--muted-foreground)]">Description</span>
                        <p className="text-sm text-[var(--foreground)] mt-1">{selectedItem.description}</p>
                      </div>
                      {selectedItem.quantity && (
                        <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                          <span className="text-xs text-[var(--muted-foreground)]">Quantity</span>
                          <p className="text-sm text-[var(--foreground)] mt-1">{selectedItem.quantity}</p>
                        </div>
                      )}
                    </div>

                    {/* Spec Sheet Section */}
                    <div className="border-t border-[var(--border)] pt-6">
                      <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">Spec Sheet</h4>

                      {selectedItemSpecSheet ? (
                        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                          <div className="p-4 bg-[var(--muted)]/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[var(--foreground)]">{selectedItemSpecSheet.displayName}</p>
                                <p className="text-xs text-[var(--muted-foreground)]">
                                  {selectedItemSpecSheet.pageCount} pages • {selectedItemSpecSheet.manufacturer}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
                                Edit Highlights
                              </button>
                              <button
                                onClick={() => handleRemoveSpecSheet(selectedItem.id)}
                                className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              >
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                          {/* Spec Sheet Preview Placeholder */}
                          <div className="h-64 bg-[var(--muted)]/20 flex items-center justify-center text-[var(--muted-foreground)]">
                            <div className="text-center">
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-2 opacity-30">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                <path d="M14 2v6h6"/>
                              </svg>
                              <span className="text-sm">Spec sheet preview</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-8 text-center">
                          <div className="w-12 h-12 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M14 2v6h6M12 18v-6M9 15h6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <h4 className="text-sm font-medium text-[var(--foreground)] mb-1">No spec sheet attached</h4>
                          <p className="text-xs text-[var(--muted-foreground)] mb-4">
                            Attach a spec sheet from your library or upload a new one
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setShowSpecSheetPicker(true)}
                              className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                            >
                              Browse Library
                            </button>
                            <button className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
                              Upload New
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center p-6">
                    <div>
                      <div className="w-16 h-16 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <path d="M14 2v6h6"/>
                          <path d="M10 9H8M10 13H8M14 13h-4M14 17H8"/>
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Select an item</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Choose an item from the list to view and edit its details
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Stakeholders Tab */}
          {activeTab === 'stakeholders' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Customers */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Customers</h3>
                    <button className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)]">+ Add</button>
                  </div>
                  <div className="space-y-2">
                    {submittal.customers.length > 0 ? submittal.customers.map((s, i) => (
                      <StakeholderCard key={i} stakeholder={s} />
                    )) : (
                      <EmptyStakeholder type="customer" />
                    )}
                  </div>
                </div>

                {/* Engineers */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Engineers</h3>
                    <button className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)]">+ Add</button>
                  </div>
                  <div className="space-y-2">
                    {submittal.engineers.length > 0 ? submittal.engineers.map((s, i) => (
                      <StakeholderCard key={i} stakeholder={s} />
                    )) : (
                      <EmptyStakeholder type="engineer" />
                    )}
                  </div>
                </div>

                {/* Architects */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Architects</h3>
                    <button className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)]">+ Add</button>
                  </div>
                  <div className="space-y-2">
                    {submittal.architects.length > 0 ? submittal.architects.map((s, i) => (
                      <StakeholderCard key={i} stakeholder={s} />
                    )) : (
                      <EmptyStakeholder type="architect" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Revisions Tab */}
          {activeTab === 'revisions' && (
            <div className="flex-1 overflow-y-auto p-6">
              <RevisionTimeline
                submittal={submittal}
                onSendEmail={(revision) => setEmailDialogRevision(revision)}
                onUploadReturned={(revision) => setUploadDialogRevision(revision)}
                onViewPdf={(url, name) => {
                  // For now, just log - would open in new tab or modal
                  console.log('View PDF:', url, name);
                  window.open(url, '_blank');
                }}
                onResubmit={(revision, returnedPdf) => handleResubmit(revision, returnedPdf)}
                onViewAnalysis={(returnedPdf) => setAnalysisReturnedPdf(returnedPdf)}
              />
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-xl space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    Job Name
                  </label>
                  <input
                    type="text"
                    defaultValue={submittal.jobName}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    Job Location
                  </label>
                  <input
                    type="text"
                    defaultValue={submittal.jobLocation || ''}
                    placeholder="Enter job location..."
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    Bid Date
                  </label>
                  <input
                    type="date"
                    defaultValue={submittal.bidDate?.split('T')[0] || ''}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(submittal.tags || []).map((tag, i) => (
                      <span key={i} className="px-2 py-1 text-xs bg-[var(--muted)] rounded-full flex items-center gap-1">
                        {tag}
                        <button className="hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add a tag..."
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>
                <div className="pt-4 border-t border-[var(--border)]">
                  <button className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    Delete Submittal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Spec Sheet Picker Modal */}
        {showSpecSheetPicker && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <h3 className="font-semibold text-[var(--foreground)]">Select Spec Sheet</h3>
                <button
                  onClick={() => setShowSpecSheetPicker(false)}
                  className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="p-4 border-b border-[var(--border)]">
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
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {filteredSpecSheets.map(specSheet => (
                  <button
                    key={specSheet.id}
                    onClick={() => handleAttachSpecSheet(specSheet.id)}
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
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Configuration Modal */}
        {showConfigModal && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <h3 className="font-semibold text-[var(--foreground)]">Submittal Configuration</h3>
                <button
                  onClick={() => setShowConfigModal(false)}
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
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfig}
                  className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Email Dialog */}
        {emailDialogRevision && (
          <SendSubmittalEmailDialog
            submittal={submittal}
            revision={emailDialogRevision}
            onClose={() => setEmailDialogRevision(null)}
            onSend={handleSendEmail}
            onSkip={() => setEmailDialogRevision(null)}
          />
        )}

        {/* Upload Returned PDF Dialog */}
        {uploadDialogRevision && (
          <ReturnedPdfUpload
            submittal={submittal}
            revision={uploadDialogRevision}
            onClose={() => setUploadDialogRevision(null)}
            onUpload={handleUploadReturned}
          />
        )}

        {/* Change Analysis Panel */}
        {analysisReturnedPdf && (
          <ChangeAnalysisPanel
            returnedPdf={analysisReturnedPdf}
            submittalItems={submittal.items}
            onClose={() => setAnalysisReturnedPdf(null)}
            onResubmit={() => {
              // Find the revision containing this returned PDF
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
      </div>
    </div>
  );
}

// Helper Components
function StakeholderCard({ stakeholder }: { stakeholder: SubmittalStakeholder }) {
  return (
    <div className="p-3 border border-[var(--border)] rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-[var(--foreground)]">{stakeholder.contactName}</span>
        <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors text-[var(--muted-foreground)]">
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      {stakeholder.companyName && (
        <p className="text-xs text-[var(--muted-foreground)]">{stakeholder.companyName}</p>
      )}
      {stakeholder.email && (
        <p className="text-xs text-[var(--muted-foreground)]">{stakeholder.email}</p>
      )}
    </div>
  );
}

function EmptyStakeholder({ type }: { type: string }) {
  return (
    <div className="p-4 border border-dashed border-[var(--border)] rounded-lg text-center">
      <p className="text-xs text-[var(--muted-foreground)]">No {type}s added yet</p>
    </div>
  );
}
