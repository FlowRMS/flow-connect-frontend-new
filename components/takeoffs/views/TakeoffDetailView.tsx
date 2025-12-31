/**
 * Take-Off Detail View Component
 * FlowCRM style with 6-step workflow
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Takeoff, TakeoffDocument, ParsedItem, TakeoffStep, DocumentClassification } from '../types';
import { ClassificationTab } from './ClassificationTab';
import { ParsingTab } from './ParsingTab';
import { getStatusColor } from '../utils';
import {
  classifyDocument as classifyDocumentAPI,
  abridgeDocument as abridgeDocumentAPI,
} from '../../lib/graphql/takeoffs';

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

// 6-step workflow configuration
const WORKFLOW_STEPS: { id: TakeoffStep; label: string; shortLabel: string }[] = [
  { id: 'review', label: 'Review Documents', shortLabel: 'Review' },
  { id: 'classification', label: 'Classification', shortLabel: 'Classification' },
  { id: 'abridgment', label: 'Create Abridged', shortLabel: 'Abridged' },
  { id: 'parsing', label: 'Schedule Parsing', shortLabel: 'Parsing' },
  { id: 'productCross', label: 'Product Cross', shortLabel: 'Cross' },
  { id: 'approvals', label: 'Approvals', shortLabel: 'Approvals' },
];

// Document classification categories
const CLASSIFICATION_CATEGORIES: { id: DocumentClassification | 'all'; label: string }[] = [
  { id: 'all', label: 'All Documents' },
  { id: 'Fixture Schedules', label: 'Fixture Schedules' },
  { id: 'Specifications', label: 'Specifications' },
  { id: 'Blueprints', label: 'Blueprints' },
  { id: 'Other Docs', label: 'Other Docs' },
  { id: 'Irrelevant', label: 'Irrelevant' },
];

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
  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentStep);

  // AI Classification state
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationProgress, setClassificationProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<DocumentClassification | 'all'>('all');

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: documents.length };
    CLASSIFICATION_CATEGORIES.forEach(cat => {
      if (cat.id !== 'all') {
        counts[cat.id] = documents.filter(d => d.classification === cat.id).length;
      }
    });
    return counts;
  }, [documents]);

  // Filter documents by selected category
  const filteredDocuments = useMemo(() => {
    if (selectedCategory === 'all') return documents;
    return documents.filter(d => d.classification === selectedCategory);
  }, [documents, selectedCategory]);

  // Run AI classification on all documents
  const runAutoClassification = useCallback(async () => {
    const unclassifiedDocs = documents.filter(d => !d.classification);
    if (unclassifiedDocs.length === 0) return;

    setIsClassifying(true);
    setClassificationProgress(0);

    for (let i = 0; i < unclassifiedDocs.length; i++) {
      const doc = unclassifiedDocs[i];
      try {
        if (doc.documentUrl) {
          const result = await classifyDocumentAPI(doc.documentUrl, doc.name);
          if (result.success && result.category) {
            // Map API category to our classification type
            const categoryMap: Record<string, DocumentClassification> = {
              fixture_schedules: 'Fixture Schedules',
              specifications: 'Specifications',
              blueprints: 'Blueprints',
              other: 'Other Docs',
              irrelevant: 'Irrelevant',
            };
            const classification = categoryMap[result.category] || 'Other Docs';
            onClassify(doc.id, classification);
          }
        }
      } catch (error) {
        console.error(`Failed to classify ${doc.name}:`, error);
      }
      setClassificationProgress(Math.round(((i + 1) / unclassifiedDocs.length) * 100));
    }

    setIsClassifying(false);
  }, [documents, onClassify]);

  // Navigation helpers
  const canGoBack = currentStepIndex > 0;
  const canGoForward = currentStepIndex < WORKFLOW_STEPS.length - 1;
  const goToPreviousStep = () => {
    if (canGoBack) {
      onStepChange(WORKFLOW_STEPS[currentStepIndex - 1].id);
    }
  };
  const goToNextStep = () => {
    if (canGoForward) {
      onStepChange(WORKFLOW_STEPS[currentStepIndex + 1].id);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-3 sm:p-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 10H5M10 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Takeoffs
      </button>

      {/* Header with title and status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)]">
            {takeoff.title}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Created by {takeoff.createdBy} on {formatDate(takeoff.createdDate)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(takeoff.status)}`}>
            {takeoff.status}
          </span>
        </div>
      </div>

      {/* 6-Step Workflow Stepper */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between overflow-x-auto">
          {WORKFLOW_STEPS.map((step, index) => {
            const isActive = currentStep === step.id;
            const isPast = index < currentStepIndex;
            const isLast = index === WORKFLOW_STEPS.length - 1;

            return (
              <div key={step.id} className="flex items-center flex-1 min-w-0">
                {/* Step Circle and Label */}
                <button
                  onClick={() => onStepChange(step.id)}
                  className="flex flex-col items-center gap-1 min-w-[80px] group"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white ring-4 ring-purple-100'
                        : isPast
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'
                    }`}
                  >
                    {isPast ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium text-center whitespace-nowrap ${
                      isActive
                        ? 'text-purple-600'
                        : isPast
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}
                  >
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.shortLabel}</span>
                  </span>
                </button>

                {/* Connector Line */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-2 min-w-[20px]">
                    <div
                      className={`h-full transition-all ${
                        isPast ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content Card */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
        {/* Classification Step Content */}
        {currentStep === 'classification' && (
          <>
            {/* Classification Header with AI Progress */}
            <div className="p-6 border-b border-[var(--border)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    Classification & Duplicate Detection
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    AI will analyze and categorize your documents automatically
                  </p>
                </div>
                {!isClassifying && (
                  <button
                    onClick={runAutoClassification}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    Run AI Classification
                  </button>
                )}
              </div>

              {/* AI Progress Bar */}
              {isClassifying && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-[var(--muted-foreground)]">
                      Classifying documents...
                    </span>
                    <span className="font-medium text-purple-600">{classificationProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all duration-300"
                      style={{ width: `${classificationProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Category Tabs */}
            <div className="border-b border-[var(--border)] bg-gray-50/50">
              <div className="flex overflow-x-auto">
                {CLASSIFICATION_CATEGORIES.map((category) => {
                  const isActive = selectedCategory === category.id;
                  const count = categoryCounts[category.id] || 0;

                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        isActive
                          ? 'border-purple-600 text-purple-600 bg-white'
                          : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/50'
                      }`}
                    >
                      {category.label}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          isActive
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Document List */}
            <div className="p-6">
              <ClassificationTab
                documents={filteredDocuments}
                onClassify={onClassify}
                onAbridge={onAbridge}
                onAbridgeAll={onAbridgeAll}
                onDownload={(doc) => alert(`Downloading ${doc.name}...`)}
                onDownloadAll={() => alert('Downloading all documents as ZIP...')}
                onViewReport={onViewReport}
                onProceedToParsing={() => onStepChange('abridgment')}
              />
            </div>
          </>
        )}

        {/* Review Step */}
        {currentStep === 'review' && (
          <div className="p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Review Documents</h3>
              <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
                Review the {documents.length} uploaded documents before proceeding to classification.
              </p>

              {/* Document Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-[var(--foreground)]">{documents.length}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Total Documents</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {documents.reduce((sum, d) => sum + d.pages, 0)}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">Total Pages</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-[var(--foreground)]">{takeoff.source}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Source</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-green-600">Ready</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Status</p>
                </div>
              </div>

              <button
                onClick={goToNextStep}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Proceed to Classification
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 10h10M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Abridgment Step */}
        {currentStep === 'abridgment' && (
          <div className="p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Create Abridged Documents</h3>
              <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
                AI will analyze documents and extract only the relevant pages for faster processing.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={onAbridgeAll}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                  </svg>
                  Abridge All Documents
                </button>
                <button
                  onClick={goToNextStep}
                  className="inline-flex items-center gap-2 px-6 py-2.5 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Skip & Continue
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 10h10M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Parsing Step */}
        {currentStep === 'parsing' && (
          <div className="p-6">
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
          </div>
        )}

        {/* Product Cross Step */}
        {currentStep === 'productCross' && (
          <div className="p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600">
                  <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Product Cross</h3>
              <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
                Cross-reference products with alternatives and find matching items in your catalog.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={onCrossAll}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                  </svg>
                  Run Product Cross
                </button>
                <button
                  onClick={goToNextStep}
                  className="inline-flex items-center gap-2 px-6 py-2.5 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Continue to Approvals
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 10h10M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approvals Step */}
        {currentStep === 'approvals' && (
          <div className="p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Approvals & Finalization</h3>
              <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
                Review the final takeoff summary and create a quote for this project.
              </p>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-[var(--foreground)]">{documents.length}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Documents</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-[var(--foreground)]">{parsedItems.length}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Items Parsed</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-green-600">
                    {parsedItems.filter(i => i.isCrossed).length}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">Items Crossed</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-purple-600">
                    {parsedItems.filter(i => i.isOurManufacturer).length}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">Our Products</p>
                </div>
              </div>

              <button
                onClick={onCreateQuote}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                Create Quote
              </button>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-gray-50/50 flex items-center justify-between">
          <button
            onClick={goToPreviousStep}
            disabled={!canGoBack}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              canGoBack
                ? 'text-[var(--foreground)] hover:bg-gray-100'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 10H5M9 14l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Previous Step
          </button>

          <div className="text-sm text-[var(--muted-foreground)]">
            Step {currentStepIndex + 1} of {WORKFLOW_STEPS.length}
          </div>

          <button
            onClick={goToNextStep}
            disabled={!canGoForward}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              canGoForward
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Next Step
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 10h10M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </main>
  );
}
