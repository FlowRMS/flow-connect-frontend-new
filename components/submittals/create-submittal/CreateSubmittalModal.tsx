'use client';

import React from 'react';
import type { CreateSubmittalModalProps } from './types';
import { useCreateSubmittal } from './useCreateSubmittal';
import { StepProgress } from './StepProgress';
import {
  QuoteSelectionStep,
  RecipientsStep,
  ItemsSelectionStep,
  ConfigureStep,
  ReviewStep,
} from './steps';

export default function CreateSubmittalModal({
  onClose,
  onCreate,
  preselectedQuoteId,
  preselectedQuoteName,
  quoteRecipients,
  quoteLineItems,
}: CreateSubmittalModalProps) {
  const wizard = useCreateSubmittal({
    preselectedQuoteId,
    preselectedQuoteName,
    quoteRecipients,
    quoteLineItems,
    onClose,
    onCreate,
  });

  const stepDescriptions: Record<string, string> = {
    'select-quote': 'Select one or more quotes to pull items from',
    'select-recipients': 'Add recipients and project contacts',
    'select-items': 'Choose which items to include',
    'configure': 'Configure submittal details',
    'review': 'Review and create',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Create Submittal</h2>
            <p className="text-sm text-[var(--muted-foreground)]">{stepDescriptions[wizard.step]}</p>
          </div>
          <button
            onClick={onClose}
            disabled={wizard.isCreating}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <StepProgress steps={wizard.steps} currentStepIndex={wizard.currentStepIndex} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {wizard.step === 'select-quote' && (
            <QuoteSelectionStep
              selectedQuoteIds={wizard.selectedQuoteIds}
              setSelectedQuoteIds={wizard.setSelectedQuoteIds}
              quoteSearch={wizard.quoteSearch}
              setQuoteSearch={wizard.setQuoteSearch}
              filteredQuotes={wizard.filteredQuotes}
              isSearchingQuotes={wizard.isSearchingQuotes}
              isLoadingQuoteDetails={wizard.isLoadingQuoteDetails}
            />
          )}

          {wizard.step === 'select-recipients' && (
            <RecipientsStep
              recipients={wizard.recipients}
              selectedRecipientIds={wizard.selectedRecipientIds}
              toggleRecipient={wizard.toggleRecipient}
              manualContacts={wizard.manualContacts}
              setManualContacts={wizard.setManualContacts}
            />
          )}

          {wizard.step === 'select-items' && (
            <ItemsSelectionStep
              lineItems={wizard.lineItems}
              selectedItemIds={wizard.selectedItemIds}
              toggleItem={wizard.toggleItem}
              toggleAllItems={wizard.toggleAllItems}
              isLoadingQuoteDetails={wizard.isLoadingQuoteDetails}
            />
          )}

          {wizard.step === 'configure' && (
            <ConfigureStep
              submittalName={wizard.submittalName}
              setSubmittalName={wizard.setSubmittalName}
              transmittalPurpose={wizard.transmittalPurpose}
              setTransmittalPurpose={wizard.setTransmittalPurpose}
              notes={wizard.notes}
              setNotes={wizard.setNotes}
              config={wizard.config}
              updateConfig={wizard.updateConfig}
            />
          )}

          {wizard.step === 'review' && (
            <ReviewStep
              submittalName={wizard.submittalName}
              selectedQuotes={wizard.selectedQuotes}
              selectedRecipients={wizard.selectedRecipients}
              selectedItemIds={wizard.selectedItemIds}
              lineItems={wizard.lineItems}
              transmittalPurpose={wizard.transmittalPurpose}
              notes={wizard.notes}
              manualContacts={wizard.manualContacts}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
          <button
            onClick={wizard.handleBack}
            disabled={wizard.isCreating}
            className="px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(wizard.step === 'select-quote' || (wizard.step === 'select-recipients' && preselectedQuoteId)) ? 'Cancel' : 'Back'}
          </button>

          {wizard.step === 'review' ? (
            <button
              onClick={wizard.handleCreate}
              disabled={wizard.isCreating}
              className="px-6 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {wizard.isCreating ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Submittal...
                </>
              ) : (
                'Create Submittal'
              )}
            </button>
          ) : (
            <button
              onClick={wizard.handleNext}
              disabled={!wizard.canProceed}
              className="px-6 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
