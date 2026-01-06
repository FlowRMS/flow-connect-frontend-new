/**
 * Take-Off Detail View Component
 * FlowCRM style with 6-step workflow
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Takeoff, TakeoffDocument, ParsedItem, TakeoffStep, DocumentClassification, DocumentDiscipline } from '../types';
import { ClassificationTab } from './ClassificationTab';
import { ParsingTab } from './ParsingTab';
import { ProductCrossDetailView, type CrossType, type ProductCrossResult } from './ProductCrossDetailView';
import { getStatusColor } from '../utils';
import {
  classifyDocument as classifyDocumentAPI,
  abridgeDocument as abridgeDocumentAPI,
} from '../../lib/graphql/takeoffs';
import { takeoffToasts } from '../../lib/toast';

interface TakeoffDetailViewProps {
  takeoff: Takeoff;
  currentStep: TakeoffStep;
  documents: TakeoffDocument[];
  parsedItems: ParsedItem[];
  selectedItems: Set<string>;
  productCrossResults?: ProductCrossResult[];
  selectedCrossTypes?: CrossType[];
  isProductCrossProcessing?: boolean;
  isParsingProcessing?: boolean;
  parsingProgress?: number;
  parsingMessage?: string | null;
  isAbridgementProcessing?: boolean;
  abridgementProgress?: number;
  documentAbridgementProgress?: Record<string, { progress: number; status: 'pending' | 'processing' | 'complete' | 'error'; error?: string; logs: string[] }>;
  documentAbridgeState?: Record<string, { isProcessing: boolean; error?: string }>;
  itemCrossingState?: Record<string, { isProcessing: boolean; error?: string }>;
  onBack: () => void;
  onStepChange: (step: TakeoffStep) => void;
  onClassify: (docId: string, classification: DocumentClassification) => void;
  onChangeDiscipline?: (docId: string, discipline: DocumentDiscipline) => void;
  onAbridge: (docId: string) => void;
  onAbridgeAll: () => void;
  onParseSchedules?: () => void;
  onProceedToParsing?: () => void;
  onViewReport: (doc: TakeoffDocument) => void;
  onCrossItem: (itemId: string) => void;
  onCrossSelected: () => void;
  onCrossAll: () => void;
  onToggleSelect: (itemId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onCreateQuote: () => void;
  onDownloadDocument?: (doc: TakeoffDocument) => void;
  onDownloadAllDocuments?: () => void;
  onCrossTypesChange?: (types: CrossType[]) => void;
  onSelectAlternative?: (originalIndex: number, altIndex: number) => void;
  onDeleteCrossAlternative?: (originalIndex: number, altIndex: number) => void;
  onRerunCross?: (prompt: string, crossTypes: CrossType[]) => void;
  shouldAutoClassify?: boolean;
  onAutoClassifyComplete?: () => void;
  onUpdateTitle?: (title: string) => void;
}

// 6-step workflow configuration with colors
const WORKFLOW_STEPS: { id: TakeoffStep; label: string; shortLabel: string; colors: { bg: string; ring: string; text: string; bgLight: string } }[] = [
  { id: 'review', label: 'Review Documents', shortLabel: 'Review', colors: { bg: 'bg-teal-500', ring: 'ring-teal-100', text: 'text-teal-600', bgLight: 'bg-teal-100' } },
  { id: 'classification', label: 'Classification', shortLabel: 'Classification', colors: { bg: 'bg-purple-600', ring: 'ring-purple-100', text: 'text-purple-600', bgLight: 'bg-purple-100' } },
  { id: 'abridgment', label: 'Create Abridged', shortLabel: 'Abridged', colors: { bg: 'bg-amber-500', ring: 'ring-amber-100', text: 'text-amber-600', bgLight: 'bg-amber-100' } },
  { id: 'parsing', label: 'Schedule Parsing', shortLabel: 'Parsing', colors: { bg: 'bg-blue-500', ring: 'ring-blue-100', text: 'text-blue-600', bgLight: 'bg-blue-100' } },
  { id: 'productCross', label: 'Product Cross', shortLabel: 'Cross', colors: { bg: 'bg-orange-500', ring: 'ring-orange-100', text: 'text-orange-600', bgLight: 'bg-orange-100' } },
  { id: 'approvals', label: 'Approvals', shortLabel: 'Approvals', colors: { bg: 'bg-green-500', ring: 'ring-green-100', text: 'text-green-600', bgLight: 'bg-green-100' } },
];


export function TakeoffDetailView({
  takeoff,
  currentStep,
  documents,
  parsedItems,
  selectedItems,
  productCrossResults = [],
  selectedCrossTypes = ['SIMPLE', 'UPGRADE', 'VALUE'],
  isProductCrossProcessing = false,
  isParsingProcessing = false,
  parsingProgress = 0,
  parsingMessage = null,
  isAbridgementProcessing = false,
  abridgementProgress = 0,
  documentAbridgementProgress = {},
  documentAbridgeState = {},
  itemCrossingState = {},
  onBack,
  onStepChange,
  onClassify,
  onChangeDiscipline,
  onAbridge,
  onAbridgeAll,
  onParseSchedules,
  onProceedToParsing,
  onViewReport,
  onCrossItem,
  onCrossSelected,
  onCrossAll,
  onToggleSelect,
  onSelectAll,
  onCreateQuote,
  onDownloadDocument,
  onDownloadAllDocuments,
  onCrossTypesChange,
  onSelectAlternative,
  onDeleteCrossAlternative,
  onRerunCross,
  shouldAutoClassify = false,
  onAutoClassifyComplete,
  onUpdateTitle,
}: TakeoffDetailViewProps) {
  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentStep);

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(takeoff.title || '');

  // Handle title save
  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== takeoff.title) {
      onUpdateTitle?.(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(takeoff.title || '');
      setIsEditingTitle(false);
    }
  };

  // AI Classification state
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationProgress, setClassificationProgress] = useState(0);
  const [classifyingDocIds, setClassifyingDocIds] = useState<Set<string>>(new Set());
  // Ref to prevent double-triggering of auto-classification (React StrictMode or race conditions)
  const autoClassifyTriggeredRef = useRef(false);
  // Ref to track if component is mounted for cleanup
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Reset auto-classify trigger so it can run again when user comes back
      autoClassifyTriggeredRef.current = false;
    };
  }, []);

  // Run AI classification on all documents
  const runAutoClassification = useCallback(async (isAutoTriggered = false) => {
    console.log('[Classification] Starting AI classification...', isAutoTriggered ? '(auto-triggered)' : '(manual)');
    console.log('[Classification] Total documents:', documents.length);

    if (documents.length === 0) {
      console.log('[Classification] No documents to classify');
      if (!isAutoTriggered) takeoffToasts.classificationError('No documents to classify. Please upload documents first.');
      onAutoClassifyComplete?.();
      return;
    }

    const unclassifiedDocs = documents.filter(d => !d.classification);
    console.log('[Classification] Unclassified documents:', unclassifiedDocs.length);

    if (unclassifiedDocs.length === 0) {
      console.log('[Classification] All documents are already classified');
      if (!isAutoTriggered) {
        // Show summary of already classified documents
        const fixtures = documents.filter(d => d.classification === 'Fixture Schedules').length;
        const specs = documents.filter(d => d.classification === 'Specifications').length;
        const blueprints = documents.filter(d => d.classification === 'Blueprints').length;
        const other = documents.filter(d => d.classification === 'Other Docs').length;
        const irrelevant = documents.filter(d => d.classification === 'Irrelevant').length;
        takeoffToasts.classificationComplete({ total: documents.length, fixtures, specs, blueprints, other, irrelevant });
      }
      onAutoClassifyComplete?.();
      return;
    }

    const docsWithUrls = unclassifiedDocs.filter(d => d.documentUrl);
    console.log('[Classification] Documents with URLs:', docsWithUrls.length);

    if (docsWithUrls.length === 0) {
      console.log('[Classification] No documents have URLs for classification');
      if (!isAutoTriggered) takeoffToasts.classificationError('No documents have URLs for classification. This may be a loading issue.');
      onAutoClassifyComplete?.();
      return;
    }

    setIsClassifying(true);
    setClassificationProgress(0);

    // Show toast when classification starts
    takeoffToasts.classificationStarted(docsWithUrls.length);

    // Track classification results
    const results = { fixtures: 0, specs: 0, blueprints: 0, other: 0, irrelevant: 0 };

    for (let i = 0; i < docsWithUrls.length; i++) {
      // Check if component is still mounted
      if (!isMountedRef.current) {
        console.log('[Classification] Component unmounted, stopping classification');
        return;
      }

      const doc = docsWithUrls[i];
      // Mark this document as being classified
      setClassifyingDocIds(prev => new Set(prev).add(doc.id));
      try {
        console.log(`[Classification] Classifying ${doc.name}...`);
        const result = await classifyDocumentAPI(doc.documentUrl!, doc.name);

        // Check again after async call
        if (!isMountedRef.current) {
          console.log('[Classification] Component unmounted after API call, stopping');
          return;
        }

        console.log(`[Classification] Result for ${doc.name}:`, result);

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

          // Track results
          if (classification === 'Fixture Schedules') results.fixtures++;
          else if (classification === 'Specifications') results.specs++;
          else if (classification === 'Blueprints') results.blueprints++;
          else if (classification === 'Other Docs') results.other++;
          else if (classification === 'Irrelevant') results.irrelevant++;
        } else {
          console.error(`[Classification] Failed to classify ${doc.name}:`, result.error);
          // Set as "Other Docs" when classification fails so it doesn't stay as "Select..."
          onClassify(doc.id, 'Other Docs');
          results.other++;
        }
      } catch (error) {
        console.error(`[Classification] Error classifying ${doc.name}:`, error);
        // Set as "Other Docs" when there's an error so it doesn't stay as "Select..."
        if (isMountedRef.current) {
          onClassify(doc.id, 'Other Docs');
        }
        results.other++;
      }
      // Remove from classifying set (only if still mounted)
      if (isMountedRef.current) {
        setClassifyingDocIds(prev => {
          const next = new Set(prev);
          next.delete(doc.id);
          return next;
        });
        setClassificationProgress(Math.round(((i + 1) / docsWithUrls.length) * 100));
      }
    }

    // Only update state if still mounted
    if (isMountedRef.current) {
      setIsClassifying(false);
      console.log('[Classification] Classification complete');

      // Show completion toast with results
      takeoffToasts.classificationComplete({
        total: docsWithUrls.length,
        ...results,
      });
    }

    onAutoClassifyComplete?.();
  }, [documents, onClassify, onAutoClassifyComplete]);

  // Auto-run classification when entering classification view with unclassified documents
  useEffect(() => {
    const unclassifiedCount = documents.filter(d => !d.classification && d.documentUrl).length;

    if ((currentStep === 'classification' || currentStep === 'review') &&
        unclassifiedCount > 0 &&
        !isClassifying &&
        documents.length > 0) {
      // Prevent double-triggering due to React StrictMode or race conditions
      if (autoClassifyTriggeredRef.current) {
        console.log('[Classification] Auto-classification already triggered, skipping...');
        return;
      }
      autoClassifyTriggeredRef.current = true;
      console.log('[Classification] Auto-starting classification for', unclassifiedCount, 'unclassified documents...');
      runAutoClassification(true); // true = auto-triggered, don't show alerts
    }
  }, [currentStep, documents, isClassifying, runAutoClassification]);

  // Reset the auto-classify ref when leaving classification step
  useEffect(() => {
    if (currentStep !== 'classification' && currentStep !== 'review') {
      autoClassifyTriggeredRef.current = false;
    }
  }, [currentStep]);

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
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors text-sm"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 10H5M10 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Takeoffs
      </button>

      {/* Header with editable title and ID */}
      <div className="mb-6">
        {isEditingTitle ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-purple-500 outline-none w-full max-w-md"
            placeholder="Enter takeoff title..."
          />
        ) : (
          <div className="flex items-center gap-2 group">
            <h1 className="text-2xl font-bold text-gray-900">
              {takeoff.title || 'New Takeoff Project'}
            </h1>
            <button
              onClick={() => {
                setEditedTitle(takeoff.title || '');
                setIsEditingTitle(true);
              }}
              className="p-1 text-gray-400 hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Edit title"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
        )}
        <p className="text-sm text-gray-500 mt-1">
          TO-{takeoff.id?.slice(0, 3).toUpperCase() || 'NEW'}
        </p>
      </div>

      {/* Simple Tabs: Classification | Schedule Parsing */}
      <div className="flex items-center gap-8 border-b border-gray-200 mb-6">
        <button
          onClick={() => onStepChange('classification')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            currentStep === 'classification' || currentStep === 'review'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Classification
        </button>
        <button
          onClick={() => onStepChange('parsing')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            currentStep === 'parsing'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Schedule Parsing
        </button>
      </div>

      {/* 6-Step Workflow Stepper - Hidden for simplified view */}
      {false && (
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 mb-6 shadow-sm">
        {/* Stepper Icons */}
        <div className="flex items-center justify-between overflow-x-auto">
          {WORKFLOW_STEPS.map((step, index) => {
            const isActive = currentStep === step.id;
            const isPast = index < currentStepIndex;
            const isLast = index === WORKFLOW_STEPS.length - 1;

            // Step-specific icons
            const getStepIcon = () => {
              if (isPast) {
                return (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                );
              }
              switch (step.id) {
                case 'review':
                  return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  );
                case 'classification':
                  return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  );
                case 'abridgment':
                  return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="6" cy="6" r="3"/>
                      <circle cx="6" cy="18" r="3"/>
                      <line x1="20" y1="4" x2="8.12" y2="15.88"/>
                      <line x1="14.47" y1="14.48" x2="20" y2="20"/>
                      <line x1="8.12" y1="8.12" x2="12" y2="12"/>
                    </svg>
                  );
                case 'parsing':
                  return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                  );
                case 'productCross':
                  return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1"/>
                      <rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="14" y="14" width="7" height="7" rx="1"/>
                      <rect x="3" y="14" width="7" height="7" rx="1"/>
                    </svg>
                  );
                case 'approvals':
                  return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  );
                default:
                  return <span>{index + 1}</span>;
              }
            };

            return (
              <div key={step.id} className="flex items-center flex-1 min-w-0">
                {/* Step Circle and Label */}
                <button
                  onClick={() => onStepChange(step.id)}
                  className="flex flex-col items-center gap-2 min-w-[80px] group"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? `${step.colors.bg} text-white ring-4 ${step.colors.ring}`
                        : isPast
                        ? 'bg-green-500 text-white'
                        : 'bg-white border-2 border-gray-300 text-gray-500 group-hover:border-gray-400'
                    }`}
                  >
                    {getStepIcon()}
                  </div>
                  <div className="text-center">
                    <span
                      className={`text-xs font-medium whitespace-nowrap block ${
                        isActive
                          ? step.colors.text
                          : isPast
                          ? 'text-green-600'
                          : 'text-gray-500'
                      }`}
                    >
                      <span className="hidden sm:inline">{step.label}</span>
                      <span className="sm:hidden">{step.shortLabel}</span>
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)] hidden sm:block">
                      {step.id === 'review' && 'View uploaded files'}
                      {step.id === 'classification' && 'Categorize documents'}
                      {step.id === 'abridgment' && 'Generate summaries'}
                      {step.id === 'parsing' && 'Extract fixture data'}
                      {step.id === 'productCross' && 'Cross to own lines'}
                      {step.id === 'approvals' && 'Request approvals'}
                    </span>
                  </div>
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

        {/* Navigation Buttons - Below Stepper */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
          <button
            onClick={goToPreviousStep}
            disabled={!canGoBack}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              canGoBack
                ? 'text-[var(--foreground)] hover:bg-gray-100 border border-[var(--border)]'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 10H5M9 14l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Previous Step
          </button>

          {(() => {
            const nextStep = canGoForward ? WORKFLOW_STEPS[currentStepIndex + 1] : null;
            const buttonBg = nextStep?.colors?.bg ?? 'bg-gray-200';
            const hoverBg = nextStep?.colors?.bg?.replace('500', '600')?.replace('600', '700') ?? '';
            return (
              <button
                onClick={goToNextStep}
                disabled={!canGoForward}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  canGoForward
                    ? `${buttonBg} text-white hover:opacity-90`
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next Step
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 10h10M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            );
          })()}
        </div>
      </div>
      )}

      {/* Step Content */}
      <div>
        {/* Classification Step Content */}
        {(currentStep === 'classification' || currentStep === 'review') && (
          <ClassificationTab
                documents={documents}
                onClassify={onClassify}
                onChangeDiscipline={onChangeDiscipline}
                onAbridge={onAbridge}
                onAbridgeAll={onAbridgeAll}
                onDownload={onDownloadDocument}
                onDownloadAll={onDownloadAllDocuments}
                onViewReport={onViewReport}
                onProceedToParsing={onProceedToParsing || (() => onStepChange('parsing'))}
                documentAbridgeState={documentAbridgeState}
                classifyingDocIds={classifyingDocIds}
                isClassifying={isClassifying}
                isAbridgementProcessing={isAbridgementProcessing}
                abridgementCurrentItem={abridgementState?.currentItem}
              />
        )}

        {/* Review Step - Hidden, now handled by Classification */}
        {false && currentStep === 'review' && (
          <div className="p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
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
            </div>
          </div>
        )}

        {/* Abridgment Step */}
        {currentStep === 'abridgment' && (
          <div className="p-6">
            {/* Abridgment Header */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
                {/* Scissors icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
                  <circle cx="6" cy="6" r="3"/>
                  <circle cx="6" cy="18" r="3"/>
                  <line x1="20" y1="4" x2="8.12" y2="15.88"/>
                  <line x1="14.47" y1="14.48" x2="20" y2="20"/>
                  <line x1="8.12" y1="8.12" x2="12" y2="12"/>
                </svg>
                Create Abridged Documents
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Generate condensed versions of fixture schedules and specifications by extracting only relevant pages.
              </p>
            </div>

            {/* Documents Ready Summary */}
            {(() => {
              const fixtureCount = documents.filter(d => d.classification === 'Fixture Schedules' && !d.abridged).length;
              const specCount = documents.filter(d => d.classification === 'Specifications' && !d.abridged).length;
              const blueprintCount = documents.filter(d => d.classification === 'Blueprints').length;
              const otherCount = documents.filter(d =>
                d.classification !== 'Fixture Schedules' &&
                d.classification !== 'Specifications' &&
                d.classification !== 'Blueprints'
              ).length;
              const totalReady = fixtureCount + specCount;
              const summaryText = `${fixtureCount} Fixtures + ${specCount} Specs + ${blueprintCount} blueprints + ${otherCount} other documents`;

              if (totalReady > 0) {
                return (
                  <div className="mb-6">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 flex-shrink-0">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          {totalReady} document{totalReady !== 1 ? 's' : ''} ready for abridgment
                        </p>
                        <p className="text-xs text-blue-700">{summaryText}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mt-4">
                      <button
                        onClick={goToPreviousStep}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M15 10H5M9 14l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Back
                      </button>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={goToNextStep}
                          disabled={isAbridgementProcessing}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          Skip This Step
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 10h10M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          onClick={onAbridgeAll}
                          disabled={isAbridgementProcessing}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                        >
                          {isAbridgementProcessing ? (
                            <>
                              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                              </svg>
                              Start Processing
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // No documents ready - show info message with count (reuse summaryText)
              return (
                <div className="mb-6">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 flex-shrink-0">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          No documents ready for abridgment
                        </p>
                        <p className="text-xs text-blue-700">{summaryText}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={goToPreviousStep}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 10H5M9 14l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Back
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={goToNextStep}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Skip This Step
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 10h10M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={onAbridgeAll}
                        disabled={isAbridgementProcessing}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                      >
                        {isAbridgementProcessing ? (
                          <>
                            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                            Start Processing
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Progress Bar - Show when processing or has any document progress */}
            {(() => {
              const abridgableDocs = documents.filter(d =>
                d.classification === 'Fixture Schedules' || d.classification === 'Specifications'
              );
              const totalDocs = abridgableDocs.length;
              const completedDocs = abridgableDocs.filter(d =>
                d.abridged || documentAbridgementProgress[d.id]?.status === 'complete'
              ).length;
              const successfulDocs = abridgableDocs.filter(d =>
                d.abridged || documentAbridgementProgress[d.id]?.status === 'complete'
              ).length;
              const remainingDocs = totalDocs - completedDocs;
              const hasAnyProgress = Object.keys(documentAbridgementProgress).length > 0;

              if (!isAbridgementProcessing && !hasAnyProgress) return null;

              return (
                <div className="mb-6 p-4 bg-white border border-[var(--border)] rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {isAbridgementProcessing && (
                        <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                      )}
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {isAbridgementProcessing ? 'Processing Documents...' : 'Processing Complete'}
                      </span>
                    </div>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {completedDocs} / {totalDocs} completed
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${totalDocs > 0 ? (completedDocs / totalDocs) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-green-600">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {successfulDocs} successful
                    </span>
                    <span className="flex items-center gap-1 text-[var(--muted-foreground)]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {remainingDocs} remaining
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Document Cards with Processing Logs - Only show when processing or has progress */}
            {(isAbridgementProcessing || Object.keys(documentAbridgementProgress).length > 0) && (
            <div className="space-y-4">
              {documents.filter(d => d.classification === 'Fixture Schedules' || d.classification === 'Specifications').map((doc) => {
                const docProgress = documentAbridgementProgress[doc.id];
                const isProcessing = docProgress?.status === 'processing';
                const isComplete = doc.abridged || docProgress?.status === 'complete';
                const isPending = docProgress?.status === 'pending';
                const isError = docProgress?.status === 'error';
                const logs = docProgress?.logs || [];

                return (
                  <div
                    key={doc.id}
                    className={`border rounded-lg overflow-hidden ${
                      isComplete ? 'border-green-200 bg-green-50/30' :
                      isProcessing ? 'border-purple-200 bg-purple-50/30' :
                      isError ? 'border-red-200 bg-red-50/30' :
                      'border-[var(--border)] bg-white'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                      <div className="flex items-center gap-3">
                        {/* Status Icon */}
                        {isProcessing ? (
                          <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                        ) : isComplete ? (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </div>
                        ) : isPending ? (
                          <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{doc.name}</p>
                          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              doc.classification === 'Fixture Schedules' ? 'bg-purple-100 text-purple-700' :
                              doc.classification === 'Specifications' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {doc.classification}
                            </span>
                            <span>{doc.abridged ? `${doc.abridgedPages}/${doc.pages} pages` : `${doc.pages} pages`}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Only show when complete */}
                      <div className="flex items-center gap-2">
                        {isComplete && doc.abridgedUrl && (
                          <button
                            onClick={() => window.open(doc.abridgedUrl, '_blank')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-md text-xs font-medium hover:bg-purple-700 transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10 3v10m0 0l-3-3m3 3l3-3M3 17h14" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Download PDF
                          </button>
                        )}
                        {isComplete && (
                          <button
                            onClick={() => onViewReport(doc)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] text-[var(--foreground)] rounded-md text-xs font-medium hover:bg-gray-50 transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                            </svg>
                            Report
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Processing Logs */}
                    {(isProcessing || logs.length > 0) && (
                      <div className="px-4 py-3 bg-gray-50 border-l-4 border-indigo-400 font-mono text-xs max-h-40 overflow-y-auto">
                        {logs.map((log, index) => (
                          <div key={index} className="text-gray-700 py-0.5">
                            {log}
                          </div>
                        ))}
                        {isProcessing && logs.length === 0 && (
                          <div className="text-gray-500 animate-pulse">Initializing...</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {/* Parsing Step */}
        {currentStep === 'parsing' && (
          <div className="p-6">
            {/* Processing State */}
            {isParsingProcessing && (
              <div className="bg-white rounded-lg border border-gray-200 p-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Parsing Documents...</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Extracting product items from your fixture schedule documents.
                  </p>
                  <div className="max-w-xs mx-auto">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium text-blue-600">{parsingProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${parsingProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ParsingTab - shows empty state or table */}
            {!isParsingProcessing && (
              <ParsingTab
                items={parsedItems}
                selectedItems={selectedItems}
                message={parsingMessage}
                itemCrossingState={itemCrossingState}
                onCrossItem={onCrossItem}
                onCrossSelected={onCrossSelected}
                onCrossAll={onCrossAll}
                onToggleSelect={onToggleSelect}
                onSelectAll={onSelectAll}
                onCreateQuote={onCreateQuote}
              />
            )}
          </div>
        )}

        {/* Product Cross Step */}
        {currentStep === 'productCross' && (
          <div className="p-6">
            {/* Header with Run Button */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
                  {/* 4 squares icon - Orange */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                  </svg>
                  Product Cross Results
                </h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Review and select alternative products for your specification items
                </p>
              </div>
              {productCrossResults.length === 0 && (
                <button
                  onClick={onCrossAll}
                  disabled={isProductCrossProcessing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {isProductCrossProcessing ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                      </svg>
                      Run Product Cross
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Product Cross Detail View */}
            <ProductCrossDetailView
              crosses={productCrossResults}
              selectedCrossTypes={selectedCrossTypes}
              onCrossTypesChange={onCrossTypesChange || (() => {})}
              onSelectAlternative={onSelectAlternative || (() => {})}
              onDeleteCross={onDeleteCrossAlternative || (() => {})}
              onRerunCross={onRerunCross || (() => {})}
              onContinue={goToNextStep}
              isProcessing={isProductCrossProcessing}
            />
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

              {/* Selected Product Crosses */}
              {productCrossResults.length > 0 && (
                <div className="max-w-3xl mx-auto mb-8 text-left">
                  <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Selected Product Alternatives ({productCrossResults.filter(c => c.alternatives.some(a => a.selected)).length} items)
                  </h4>
                  <div className="bg-white rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
                    {productCrossResults.map((cross, index) => {
                      const selectedAlt = cross.alternatives.find(a => a.selected);
                      if (!selectedAlt) return null;
                      return (
                        <div key={index} className="p-3 flex items-center justify-between text-sm">
                          <div>
                            <span className="text-[var(--muted-foreground)]">{cross.original.manufacturer} {cross.original.partNumber}</span>
                            <span className="mx-2 text-gray-400">→</span>
                            <span className="font-medium text-[var(--foreground)]">{selectedAlt.name}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            selectedAlt.crossType === 'UPGRADE' ? 'bg-purple-100 text-purple-700' :
                            selectedAlt.crossType === 'SIMPLE' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {selectedAlt.crossType === 'SIMPLE' ? 'Direct' :
                             selectedAlt.crossType === 'UPGRADE' ? 'Upgrade' : 'Value'}
                          </span>
                        </div>
                      );
                    })}
                    {productCrossResults.filter(c => c.alternatives.some(a => a.selected)).length === 0 && (
                      <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">
                        No alternatives selected yet. Go back to Product Cross step to select alternatives.
                      </div>
                    )}
                  </div>
                </div>
              )}

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

      </div>
    </main>
  );
}
