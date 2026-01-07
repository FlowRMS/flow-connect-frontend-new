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
  onBulkClassify?: (classifications: Record<string, DocumentClassification>) => Promise<void>;
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
}

// Simplified 2-tab workflow configuration
const WORKFLOW_STEPS: { id: TakeoffStep; label: string; shortLabel: string; colors: { bg: string; ring: string; text: string; bgLight: string } }[] = [
  { id: 'classification', label: 'Classification', shortLabel: 'Classification', colors: { bg: 'bg-purple-600', ring: 'ring-purple-100', text: 'text-purple-600', bgLight: 'bg-purple-100' } },
  { id: 'parsing', label: 'Schedule Parsing', shortLabel: 'Parsing', colors: { bg: 'bg-blue-500', ring: 'ring-blue-100', text: 'text-blue-600', bgLight: 'bg-blue-100' } },
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
  onBulkClassify,
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
}: TakeoffDetailViewProps) {
  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentStep);

  // AI Classification state
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationProgress, setClassificationProgress] = useState(0);
  const [classifyingDocIds, setClassifyingDocIds] = useState<Set<string>>(new Set());
  // Ref to prevent double-triggering of auto-classification (React StrictMode or race conditions)
  const autoClassifyTriggeredRef = useRef(false);
  // Ref to track if classification is in progress (synchronous check for race conditions)
  const isClassifyingRef = useRef(false);
  // Ref to track if component is mounted for cleanup
  const isMountedRef = useRef(true);

  // Derive current processing document name from documentAbridgementProgress
  const abridgementCurrentItem = useMemo(() => {
    const processingDocId = Object.entries(documentAbridgementProgress).find(
      ([, progress]) => progress.status === 'processing'
    )?.[0];
    if (processingDocId) {
      return documents.find(d => d.id === processingDocId)?.name;
    }
    return undefined;
  }, [documentAbridgementProgress, documents]);

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
    // Prevent duplicate calls using ref (synchronous check)
    if (isClassifyingRef.current) {
      console.log('[Classification] Classification already in progress, skipping duplicate call');
      return;
    }
    isClassifyingRef.current = true;

    console.log('[Classification] Starting AI classification...', isAutoTriggered ? '(auto-triggered)' : '(manual)');
    console.log('[Classification] Total documents:', documents.length);

    if (documents.length === 0) {
      console.log('[Classification] No documents to classify');
      if (!isAutoTriggered) takeoffToasts.classificationError('No documents to classify. Please upload documents first.');
      isClassifyingRef.current = false;
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
      isClassifyingRef.current = false;
      onAutoClassifyComplete?.();
      return;
    }

    const docsWithUrls = unclassifiedDocs.filter(d => d.documentUrl);
    console.log('[Classification] Documents with URLs:', docsWithUrls.length);

    if (docsWithUrls.length === 0) {
      console.log('[Classification] No documents have URLs for classification');
      if (!isAutoTriggered) takeoffToasts.classificationError('No documents have URLs for classification. This may be a loading issue.');
      isClassifyingRef.current = false;
      onAutoClassifyComplete?.();
      return;
    }

    setIsClassifying(true);
    setClassificationProgress(0);

    // Show toast when classification starts
    takeoffToasts.classificationStarted(docsWithUrls.length);

    // Track classification results and collect all classifications
    const results = { fixtures: 0, specs: 0, blueprints: 0, other: 0, irrelevant: 0 };
    const classifications: Record<string, DocumentClassification> = {};

    for (let i = 0; i < docsWithUrls.length; i++) {
      // Check if component is still mounted
      if (!isMountedRef.current) {
        console.log('[Classification] Component unmounted, stopping classification');
        isClassifyingRef.current = false;
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
          isClassifyingRef.current = false;
          return;
        }

        console.log(`[Classification] Result for ${doc.name}:`, result);

        if (result.success && result.category) {
          // Map API category to our classification type
          // API may return either snake_case or Title Case format
          const categoryMap: Record<string, DocumentClassification> = {
            // snake_case format
            fixture_schedules: 'Fixture Schedules',
            specifications: 'Specifications',
            blueprints: 'Blueprints',
            other: 'Other Docs',
            irrelevant: 'Irrelevant',
            // Title Case format (actual API response)
            'Fixture Schedules': 'Fixture Schedules',
            'Specifications': 'Specifications',
            'Blueprints': 'Blueprints',
            'Other Docs': 'Other Docs',
            'Irrelevant': 'Irrelevant',
          };
          const classification = categoryMap[result.category] || 'Other Docs';
          // Collect classification instead of updating state immediately
          classifications[doc.id] = classification;

          // Track results
          if (classification === 'Fixture Schedules') results.fixtures++;
          else if (classification === 'Specifications') results.specs++;
          else if (classification === 'Blueprints') results.blueprints++;
          else if (classification === 'Other Docs') results.other++;
          else if (classification === 'Irrelevant') results.irrelevant++;
        } else {
          console.error(`[Classification] Failed to classify ${doc.name}:`, result.error);
          // Set as "Other Docs" when classification fails
          classifications[doc.id] = 'Other Docs';
          results.other++;
        }
      } catch (error) {
        console.error(`[Classification] Error classifying ${doc.name}:`, error);
        // Set as "Other Docs" when there's an error
        classifications[doc.id] = 'Other Docs';
        results.other++;
      }
      // Remove from classifying set and update progress (only if still mounted)
      if (isMountedRef.current) {
        setClassifyingDocIds(prev => {
          const next = new Set(prev);
          next.delete(doc.id);
          return next;
        });
        setClassificationProgress(Math.round(((i + 1) / docsWithUrls.length) * 100));
      }
    }

    // Apply all classifications in a single bulk update
    if (isMountedRef.current && Object.keys(classifications).length > 0) {
      console.log('[Classification] Applying bulk update for', Object.keys(classifications).length, 'documents');
      if (onBulkClassify) {
        await onBulkClassify(classifications);
      } else {
        // Fallback to individual updates if bulk handler not available
        for (const [docId, classification] of Object.entries(classifications)) {
          onClassify(docId, classification);
        }
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

    isClassifyingRef.current = false;
    onAutoClassifyComplete?.();
  }, [documents, onClassify, onBulkClassify, onAutoClassifyComplete]);

  // Auto-run classification when entering classification view with unclassified documents
  useEffect(() => {
    const unclassifiedCount = documents.filter(d => !d.classification && d.documentUrl).length;

    if (currentStep === 'classification' &&
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
    if (currentStep !== 'classification') {
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

      {/* Header with title and ID */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {takeoff.title || 'New Takeoff Project'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {takeoff.takeoffNumber || `TO-${takeoff.id?.slice(0, 3).toUpperCase() || 'NEW'}`}
        </p>
      </div>

      {/* Simple Tabs: Classification | Schedule Parsing */}
      <div className="flex items-center gap-8 border-b border-gray-200 mb-6">
        <button
          onClick={() => onStepChange('classification')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            currentStep === 'classification'
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

      {/* Step Content */}
      <div>
        {/* Classification Step Content */}
        {currentStep === 'classification' && (
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
                abridgementCurrentItem={abridgementCurrentItem}
              />
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
                isProductCrossProcessing={isProductCrossProcessing}
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

      </div>
    </main>
  );
}
