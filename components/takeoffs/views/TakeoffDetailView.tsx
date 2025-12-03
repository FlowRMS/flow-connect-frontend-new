/**
 * Take-Off Detail View Component
 */

import React from 'react';
import type { Takeoff, TakeoffDocument, ParsedItem, TakeoffStep, DocumentClassification } from '../types';
import { ClassificationTab } from './ClassificationTab';
import { ParsingTab } from './ParsingTab';

interface TakeoffDetailViewProps {
  takeoff: Takeoff;
  currentStep: TakeoffStep;
  documents: TakeoffDocument[];
  parsedItems: ParsedItem[];
  selectedItems: Set<string>;
  onBack: () => void;
  onStepChange: (step: TakeoffStep) => void;
  onClassify: (docId: string, classification: DocumentClassification) => void;
  onAbridge: (docId: string) => void;
  onAbridgeAll: () => void;
  onViewReport: (doc: TakeoffDocument) => void;
  onCrossItem: (itemId: string) => void;
  onCrossSelected: () => void;
  onCrossAll: () => void;
  onToggleSelect: (itemId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onCreateQuote: () => void;
}

export function TakeoffDetailView({
  takeoff,
  currentStep,
  documents,
  parsedItems,
  selectedItems,
  onBack,
  onStepChange,
  onClassify,
  onAbridge,
  onAbridgeAll,
  onViewReport,
  onCrossItem,
  onCrossSelected,
  onCrossAll,
  onToggleSelect,
  onSelectAll,
  onCreateQuote,
}: TakeoffDetailViewProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 10H5M10 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Takeoffs
        </button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">{takeoff.title}</h1>
            <p className="text-sm text-[var(--muted-foreground)]">{takeoff.id}</p>
          </div>
        </div>

        {/* Step Tabs */}
        <div className="flex gap-2 border-b border-[var(--border)]">
          <button
            onClick={() => onStepChange('classification')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              currentStep === 'classification'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Classification
          </button>
          <button
            onClick={() => onStepChange('parsing')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              currentStep === 'parsing'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Schedule Parsing
          </button>
        </div>
      </div>

      {/* Step Content */}
      <div className="mt-6">
        {currentStep === 'classification' && (
          <ClassificationTab
            documents={documents}
            onClassify={onClassify}
            onAbridge={onAbridge}
            onAbridgeAll={onAbridgeAll}
            onDownload={(doc) => alert(`Downloading ${doc.name}...`)}
            onDownloadAll={() => alert('Downloading all documents as ZIP...')}
            onViewReport={onViewReport}
            onProceedToParsing={() => onStepChange('parsing')}
          />
        )}

        {currentStep === 'parsing' && (
          <ParsingTab
            items={parsedItems}
            selectedItems={selectedItems}
            onCrossItem={onCrossItem}
            onCrossSelected={onCrossSelected}
            onCrossAll={onCrossAll}
            onToggleSelect={onToggleSelect}
            onSelectAll={onSelectAll}
            onCreateQuote={onCreateQuote}
          />
        )}
      </div>
    </main>
  );
}
