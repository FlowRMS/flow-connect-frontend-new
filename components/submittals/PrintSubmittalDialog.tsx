'use client';

import React from 'react';
import type { Submittal } from '../../lib/types/submittals';
import {
  GeneralTab,
  TransmittalTab,
  SelectedPagesTab,
  AddressedToTab,
  usePrintDialog,
} from './print-dialog';
import type { PrintSettings, TabId } from './print-dialog';

// Re-export PrintSettings type for parent components
export type { PrintSettings } from './print-dialog';

interface PrintSubmittalDialogProps {
  submittal: Submittal;
  onClose: () => void;
  onPrint: (settings: PrintSettings) => void;
  resubmitMode?: boolean;
  resubmitItemIds?: string[];
  onAddContact?: () => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'transmittal', label: 'Transmittal' },
  { id: 'selected-pages', label: 'Selected Pages' },
  { id: 'addressed-to', label: 'Addressed To' },
];

export default function PrintSubmittalDialog({
  submittal,
  onClose,
  onPrint,
  resubmitMode = false,
  resubmitItemIds = [],
  onAddContact,
}: PrintSubmittalDialogProps) {
  const dialog = usePrintDialog({
    submittal,
    resubmitMode,
    resubmitItemIds,
    onPrint,
    onClose,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {resubmitMode ? 'Resubmit' : 'Print'} Submittal
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {submittal.jobName}{submittal.jobLocation ? ` - ${submittal.jobLocation}` : ''}
              {resubmitMode && (
                <span className="ml-2 text-amber-600">
                  (Rev {submittal.currentRevision + 1})
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] bg-[var(--muted)]/30">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => dialog.setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors relative ${
                dialog.activeTab === tab.id
                  ? 'bg-[var(--card)] text-[var(--foreground)] border-t-2 border-l border-r border-[var(--border)] border-t-[var(--primary)] -mb-px rounded-t-lg'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {dialog.activeTab === 'general' && (
            <GeneralTab
              outputType={dialog.outputType}
              setOutputType={dialog.setOutputType}
              includeCoverLetter={dialog.includeCoverLetter}
              setIncludeCoverLetter={dialog.setIncludeCoverLetter}
              includeTransmittal={dialog.includeTransmittal}
              setIncludeTransmittal={dialog.setIncludeTransmittal}
              includeSubmittalLetter={dialog.includeSubmittalLetter}
              setIncludeSubmittalLetter={dialog.setIncludeSubmittalLetter}
              includePages={dialog.includePages}
              setIncludePages={dialog.setIncludePages}
              includeTypeCoverPage={dialog.includeTypeCoverPage}
              setIncludeTypeCoverPage={dialog.setIncludeTypeCoverPage}
              showQuantities={dialog.showQuantities}
              setShowQuantities={dialog.setShowQuantities}
              hideDescriptions={dialog.hideDescriptions}
              setHideDescriptions={dialog.setHideDescriptions}
              hideNotes={dialog.hideNotes}
              setHideNotes={dialog.setHideNotes}
              saveAsAttachment={dialog.saveAsAttachment}
              setSaveAsAttachment={dialog.setSaveAsAttachment}
              showLeadTimes={dialog.showLeadTimes}
              setShowLeadTimes={dialog.setShowLeadTimes}
              useCustomerLogo={dialog.useCustomerLogo}
              setUseCustomerLogo={dialog.setUseCustomerLogo}
              printDuplex={dialog.printDuplex}
              setPrintDuplex={dialog.setPrintDuplex}
              capFileSize={dialog.capFileSize}
              setCapFileSize={dialog.setCapFileSize}
            />
          )}

          {dialog.activeTab === 'transmittal' && (
            <TransmittalTab
              attachedItems={dialog.attachedItems}
              toggleAttached={dialog.toggleAttached}
              attachedOther={dialog.attachedOther}
              setAttachedOther={dialog.setAttachedOther}
              transmittedFor={dialog.transmittedFor}
              toggleTransmittedFor={dialog.toggleTransmittedFor}
              transmittedForOther={dialog.transmittedForOther}
              setTransmittedForOther={dialog.setTransmittedForOther}
              copies={dialog.copies}
              setCopies={dialog.setCopies}
            />
          )}

          {dialog.activeTab === 'selected-pages' && (
            <SelectedPagesTab
              items={submittal.items}
              selectedItemIds={dialog.selectedItemIds}
              toggleItemSelection={dialog.toggleItemSelection}
              selectAllItems={dialog.selectAllItems}
              selectNoneItems={dialog.selectNoneItems}
            />
          )}

          {dialog.activeTab === 'addressed-to' && (
            <AddressedToTab
              contacts={dialog.allContacts}
              selectedContactIds={dialog.selectedContactIds}
              toggleContactSelection={dialog.toggleContactSelection}
              selectAllContacts={dialog.selectAllContacts}
              selectNoneContacts={dialog.selectNoneContacts}
              onAddContact={onAddContact}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-start gap-2 px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
          <button
            onClick={dialog.handlePrint}
            className={`px-5 py-2 text-sm font-medium text-white rounded transition-colors ${
              resubmitMode
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)]'
            }`}
          >
            {resubmitMode ? 'Generate Resubmittal' : 'Print'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors text-[var(--foreground)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
