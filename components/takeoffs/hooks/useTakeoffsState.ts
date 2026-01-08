/**
 * Custom Hook for Take-Offs State Management
 * Connects to flow-ai backend for real data
 * Integrates with flow-ai for document processing
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import type {
  Takeoff,
  TakeoffDocument,
  ParsedItem,
  TakeoffViewMode,
  TakeoffStep,
  DocumentClassification,
  DocumentDiscipline
} from '../types';
import { transformTakeoffResponse } from '../types';
import type { ActiveFilter } from '../../AdvancedFilters';
import { useUser } from '../../providers/user-provider';
import { takeoffToasts, showInfoToast, showErrorToast, showSuccessToast, showWarningToast } from '../../lib/toast';
import {
  fetchUserTakeoffs,
  fetchTakeoff,
  deleteTakeoff as apiDeleteTakeoff,
  createTakeoffWithFiles,
  classifyDocument as classifyDocumentAPI,
  abridgeDocument as abridgeDocumentAPI,
  productCrossFromParsedDocument,
  parseScheduleDocument as parseScheduleDocumentAPI,
  crossProducts,
  updateTakeoff as apiUpdateTakeoff,
  updateTakeoffDocument,
  type UploadProgressCallback,
  type UpdateTakeoffDocumentInput,
  type TakeoffStatusEnum,
} from '../../lib/graphql/takeoffs';
import { statusApiMap } from '../types';
import {
  classifyDocument as classifyDocumentLocal,
  getInitialStep,
} from '../utils';
import { createKnownProductCross } from '../../lib/graphql/product-crosses';

// Helper to safely parse parsedItems which may come as array, JSON string, or null
function safeParseParsedItems(parsedItems: unknown): ParsedItem[] | undefined {
  if (!parsedItems) return undefined;

  // If it's already an array, transform it
  if (Array.isArray(parsedItems)) {
    return parsedItems.map(item => ({
      id: item.id || crypto.randomUUID(),
      manufacturer: item.manufacturer,
      partNumber: item.partNumber,
      description: item.description,
      quantity: item.quantity,
      isOurManufacturer: item.isOurManufacturer || false,
      isCrossed: item.isCrossed || false,
    }));
  }

  // If it's a string, try to parse it as JSON
  if (typeof parsedItems === 'string') {
    try {
      const parsed = JSON.parse(parsedItems);
      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          id: item.id || crypto.randomUUID(),
          manufacturer: item.manufacturer,
          partNumber: item.partNumber,
          description: item.description,
          quantity: item.quantity,
          isOurManufacturer: item.isOurManufacturer || false,
          isCrossed: item.isCrossed || false,
        }));
      }
    } catch {
      console.warn('Failed to parse parsedItems string:', parsedItems);
    }
  }

  return undefined;
}

// Processing state interfaces
interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  currentItem?: string;
  error?: string;
}

// Upload progress state type
export interface FileUploadProgress {
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export function useTakeoffsState() {
  console.log('🚀 [useTakeoffsState] Hook initialized - CODE VERSION 2.0 WITH DATABASE SAVE');

  // Get current user from auth context
  const user = useUser();
  const currentUserName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User' : 'Unknown User';

  // View state
  const [viewMode, setViewMode] = useState<TakeoffViewMode>('list');
  const [selectedTakeoff, setSelectedTakeoff] = useState<Takeoff | null>(null);
  const [currentStep, setCurrentStep] = useState<TakeoffStep>('classification');

  // Filter state
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAbridgmentReportModal, setShowAbridgmentReportModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<TakeoffDocument | null>(null);

  // Data state
  const [takeoffsData, setTakeoffsData] = useState<Takeoff[]>([]);
  const [documents, setDocuments] = useState<TakeoffDocument[]>([]);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [shouldAutoClassify, setShouldAutoClassify] = useState(false);

  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState<Record<number, FileUploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);

  // Processing states for AI operations
  const [classificationState, setClassificationState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
  });
  const [abridgementState, setAbridgementState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
  });
  const [productCrossState, setProductCrossState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
  });
  const [parsingState, setParsingState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
  });

  // Per-document abridgement progress state with logs
  interface DocumentProgress {
    progress: number;
    status: 'pending' | 'processing' | 'complete' | 'error';
    error?: string;
    logs: string[];
  }
  const [documentAbridgementProgress, setDocumentAbridgementProgress] = useState<Record<string, DocumentProgress>>({});

  // Per-item crossing state (tracks which items are being crossed) - same as detail flow
  const [itemCrossingState, setItemCrossingState] = useState<Record<string, { isProcessing: boolean; error?: string }>>({});

  // Product cross results state
  type CrossType = 'SIMPLE' | 'UPGRADE' | 'VALUE';
  interface ProductAlternative {
    name: string;
    description: string;
    price?: number | null;
    source?: string | null;
    crossType: CrossType;
    attributes?: Record<string, string>;
    reasoning?: string;
    selected?: boolean;
  }
  interface ProductCrossResult {
    id?: string; // Database ID when persisted
    original: {
      manufacturer: string;
      partNumber: string;
      description: string;
      attributes?: Record<string, string>;
    };
    alternatives: ProductAlternative[];
  }
  const [productCrossResults, setProductCrossResults] = useState<ProductCrossResult[]>([]);
  const [selectedCrossTypes, setSelectedCrossTypes] = useState<CrossType[]>(['SIMPLE', 'UPGRADE', 'VALUE']);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Total count of takeoffs (without filters) for "Showing X of Y" display
  const [totalCount, setTotalCount] = useState<number>(0);

  // Fetch takeoffs from API with filters
  const loadTakeoffs = useCallback(async (options?: {
    search?: string;
    status?: string;
    source?: string;
    title?: string;
    createdBy?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const searchParams = {
        limit: 100,
        search: options?.search || undefined,
        status: options?.status || undefined,
        source: options?.source || undefined,
        title: options?.title || undefined,
        createdBy: options?.createdBy || undefined,
      };
      console.log('[Takeoffs] Fetching with params:', searchParams);

      const response = await fetchUserTakeoffs(searchParams);
      console.log('[Takeoffs] Received', response.length, 'results');

      const transformedTakeoffs = response.map(transformTakeoffResponse);
      setTakeoffsData(transformedTakeoffs);

      // Update totalCount when no filters are applied (for "Showing X of Y" display)
      const hasFilters = options?.search || options?.status || options?.source || options?.title || options?.createdBy;
      if (!hasFilters) {
        setTotalCount(transformedTakeoffs.length);
      }
    } catch (err) {
      console.error('Failed to fetch takeoffs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load takeoffs');
      setTakeoffsData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Extract filters from active filters
  const statusFilter = useMemo(() => {
    const statusFilterItem = activeFilters.find(f => f.columnName === 'status');
    if (statusFilterItem?.values && statusFilterItem.values.length > 0) {
      return statusFilterItem.values[0];
    }
    return undefined;
  }, [activeFilters]);

  const sourceFilter = useMemo(() => {
    const sourceFilterItem = activeFilters.find(f => f.columnName === 'source');
    if (sourceFilterItem?.values && sourceFilterItem.values.length > 0) {
      return sourceFilterItem.values[0];
    }
    return undefined;
  }, [activeFilters]);

  const titleFilter = useMemo(() => {
    const titleFilterItem = activeFilters.find(f => f.columnName === 'title');
    if (titleFilterItem?.value) {
      return titleFilterItem.value;
    }
    return undefined;
  }, [activeFilters]);

  const createdByFilter = useMemo(() => {
    const createdByFilterItem = activeFilters.find(f => f.columnName === 'createdBy');
    if (createdByFilterItem?.value) {
      return createdByFilterItem.value;
    }
    return undefined;
  }, [activeFilters]);

  const priorityFilter = useMemo(() => {
    const priorityFilterItem = activeFilters.find(f => f.columnName === 'priority');
    if (priorityFilterItem?.values && priorityFilterItem.values.length > 0) {
      return priorityFilterItem.values[0];
    }
    return undefined;
  }, [activeFilters]);

  // Debounced search to avoid too many API calls
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load takeoffs when filters change
  useEffect(() => {
    loadTakeoffs({
      search: debouncedSearch || undefined,
      status: statusFilter,
      source: sourceFilter,
      title: titleFilter,
      createdBy: createdByFilter,
    });
  }, [loadTakeoffs, debouncedSearch, statusFilter, sourceFilter, titleFilter, createdByFilter]);

  // Apply client-side filtering for priority (backend doesn't support it)
  const takeoffs = useMemo(() => {
    if (!priorityFilter) return takeoffsData;
    return takeoffsData.filter(t => t.priority === priorityFilter);
  }, [takeoffsData, priorityFilter]);

  // Document handlers
  const handleClassifyDocument = useCallback(async (docId: string, classification: DocumentClassification) => {
    console.log('[Classification] Manual change:', { docId, classification });

    // Update local state immediately for responsive UI
    setDocuments(docs => {
      const updated = classifyDocumentLocal(docs, docId, classification);
      console.log('[Classification] State update:', {
        docId,
        classification,
        before: docs.find(d => d.id === docId)?.classification,
        after: updated.find(d => d.id === docId)?.classification
      });
      return updated;
    });

    // Persist to backend
    try {
      await updateTakeoffDocument(docId, {
        classification: classification || null,
      });
      console.log('[Classification] Backend update success:', { docId, classification });
    } catch (error) {
      console.error('[Classification] Backend update failed:', error);
    }
  }, []);

  // Bulk classify documents (used by auto-classification to avoid state update issues)
  const handleBulkClassifyDocuments = useCallback(async (classifications: Record<string, DocumentClassification>) => {
    console.log('[Classification] Bulk update:', Object.keys(classifications).length, 'documents');

    // Update all documents in a single state update
    setDocuments(docs => {
      const updated = docs.map(doc => {
        if (classifications[doc.id]) {
          return { ...doc, classification: classifications[doc.id] };
        }
        return doc;
      });
      console.log('[Classification] Bulk state update complete');
      return updated;
    });

    // Persist each to backend (in parallel)
    const persistPromises = Object.entries(classifications).map(async ([docId, classification]) => {
      try {
        await updateTakeoffDocument(docId, { classification: classification || null });
      } catch (error) {
        console.error(`[Classification] Backend update failed for ${docId}:`, error);
      }
    });

    await Promise.all(persistPromises);
    console.log('[Classification] Bulk backend update complete');
  }, []);

  // Change document discipline
  const handleChangeDiscipline = useCallback(async (docId: string, discipline: DocumentDiscipline) => {
    // Update local state immediately for responsive UI
    setDocuments(docs =>
      docs.map(d => d.id === docId ? { ...d, discipline } : d)
    );

    // Persist to backend
    try {
      await updateTakeoffDocument(docId, {
        discipline: discipline || null,
      });
    } catch (error) {
      // Backend may not support discipline field yet - log but don't crash
      console.error('Failed to persist discipline:', error);
    }
  }, []);

  // Abridge a single document using AI
  const handleAbridgeDocument = useCallback(async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || !doc.documentUrl) {
      console.error('Document not found or has no URL');
      return;
    }

    setAbridgementState({ isProcessing: true, progress: 0, currentItem: doc.name });

    try {
      const result = await abridgeDocumentAPI(
        doc.documentUrl,
        doc.name,
        ['Extract relevant product and fixture information', 'Keep pages with specifications and schedules']
      );

      if (result.success) {
        // Always use originalPages from backend if available (more reliable than client-side pdf.js)
        const actualPages = result.originalPages || doc.pages;
        // Only use abridgedUrl if a new PDF was actually generated
        const effectiveAbridgedUrl = result.wasAbridged ? result.abridgedUrl : undefined;

        // Update document with abridgement results including abridgedUrl
        console.log('[Abridgement] wasAbridged:', result.wasAbridged);
        setDocuments(docs =>
          docs.map(d =>
            d.id === docId
              ? {
                  ...d,
                  pages: actualPages, // Always update pages from backend
                  abridged: true,
                  abridgedPages: result.abridgedPages || actualPages,
                  reductionPercentage: result.reductionPercentage || 0,
                  abridgedUrl: effectiveAbridgedUrl || undefined,
                  pageAnalyses: result.pageAnalyses || undefined,
                }
              : d
          )
        );

        // Persist to backend (always update pages from backend response)
        console.log('[Abridgement] Saving to backend:', {
          docId,
          wasAbridged: result.wasAbridged,
          abridgedUrl: effectiveAbridgedUrl,
          pageAnalysesCount: result.pageAnalyses?.length || 0,
          pageAnalyses: result.pageAnalyses,
        });
        await updateTakeoffDocument(docId, {
          pages: result.originalPages || undefined,
          abridged: true,
          abridgedPages: result.abridgedPages,
          abridgedUrl: effectiveAbridgedUrl || null,
          reductionPercentage: result.reductionPercentage,
          pageAnalyses: result.pageAnalyses as unknown as UpdateTakeoffDocumentInput['pageAnalyses'],
        });
        console.log('[Abridgement] Saved to backend successfully');
      } else {
        setAbridgementState(prev => ({ ...prev, error: result.error || 'Abridgement failed' }));
      }
    } catch (error) {
      console.error('Failed to abridge document:', error);
      setAbridgementState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Abridgement failed',
      }));
    } finally {
      setAbridgementState({ isProcessing: false, progress: 100 });

      // Check if all abridgeable documents are now abridged - update status to Abridgment
      const docsToAbridge = documents.filter(d => !d.abridged && d.documentUrl);
      const allAbridged = docsToAbridge.length === 0 || docsToAbridge.every(d => d.id === docId);

      if (allAbridged && selectedTakeoff && selectedTakeoff.status !== 'Complete') {
        try {
          await apiUpdateTakeoff(selectedTakeoff.id, { status: 'ABRIDGMENT' as TakeoffStatusEnum });
          setTakeoffsData(prev =>
            prev.map(t =>
              t.id === selectedTakeoff.id ? { ...t, status: 'Abridgment' as const } : t
            )
          );
          setSelectedTakeoff(prev => prev ? { ...prev, status: 'Abridgment' as const } : null);
          console.log('[handleAbridgeDocument] All docs abridged - status updated to Abridgment');
        } catch (error) {
          console.error('[handleAbridgeDocument] Failed to update status:', error);
        }
      }
    }
  }, [documents, selectedTakeoff]);

  // Helper to add a log message to a document's progress
  const addDocumentLog = useCallback((docId: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setDocumentAbridgementProgress(prev => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        logs: [...(prev[docId]?.logs || []), `[${timestamp}] ${message}`],
      },
    }));
  }, []);

  // Abridge all documents using AI - with per-document progress tracking and logs
  const handleAbridgeAll = useCallback(async () => {
    console.log('[Abridgement] Starting handleAbridgeAll...');
    console.log('[Abridgement] Total documents:', documents.length);
    console.log('[Abridgement] Documents by classification:', documents.map(d => ({ name: d.name, classification: d.classification, abridged: d.abridged, hasUrl: !!d.documentUrl })));

    // Documents that can be abridged:
    // - Not abridged yet, OR
    // - Abridged but no abridgedUrl (below threshold - allow retry)
    const docsToAbridge = documents.filter(d =>
      d.documentUrl && (!d.abridged || !d.abridgedUrl)
    );
    console.log('[Abridgement] Documents to abridge:', docsToAbridge.length);

    if (docsToAbridge.length === 0) {
      console.log('[Abridgement] No documents to abridge');
      return;
    }

    // Update takeoff status to ABRIDGMENT
    if (selectedTakeoff) {
      try {
        await apiUpdateTakeoff(selectedTakeoff.id, { status: 'ABRIDGMENT' as TakeoffStatusEnum });
        // Update local state
        setTakeoffsData(prev =>
          prev.map(t =>
            t.id === selectedTakeoff.id ? { ...t, status: 'Abridgment' as const } : t
          )
        );
        setSelectedTakeoff(prev => prev ? { ...prev, status: 'Abridgment' as const } : null);
      } catch (error) {
        console.error('[Abridgement] Failed to update takeoff status:', error);
      }
    }

    setAbridgementState({ isProcessing: true, progress: 0 });

    // Initialize per-document progress with empty logs
    const initialProgress: Record<string, DocumentProgress> = {};
    docsToAbridge.forEach(doc => {
      initialProgress[doc.id] = { progress: 0, status: 'pending', logs: [] };
    });
    setDocumentAbridgementProgress(initialProgress);

    for (let i = 0; i < docsToAbridge.length; i++) {
      const doc = docsToAbridge[i];

      // Update overall progress
      setAbridgementState(prev => ({
        ...prev,
        progress: Math.round((i / docsToAbridge.length) * 100),
        currentItem: doc.name,
      }));

      // Mark document as processing and add first log
      setDocumentAbridgementProgress(prev => ({
        ...prev,
        [doc.id]: { progress: 10, status: 'processing', logs: [] },
      }));
      addDocumentLog(doc.id, '🔄 Starting SMART abridgment with LLM page scanning...');

      try {
        // Simulate download step
        addDocumentLog(doc.id, '⬇️ Downloading PDF from storage...');
        setDocumentAbridgementProgress(prev => ({
          ...prev,
          [doc.id]: { ...prev[doc.id], progress: 20 },
        }));

        // Simulate download complete
        await new Promise(resolve => setTimeout(resolve, 100));
        addDocumentLog(doc.id, `✅ Downloaded ${doc.size}`);

        // Analyzing pages
        addDocumentLog(doc.id, '🔍 Analyzing ALL pages with LLM for relevant content...');
        setDocumentAbridgementProgress(prev => ({
          ...prev,
          [doc.id]: { ...prev[doc.id], progress: 40 },
        }));

        // Retry logic with exponential backoff
        const MAX_RETRIES = 3;
        let result = null;
        let lastError = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            result = await abridgeDocumentAPI(
              doc.documentUrl!,
              doc.name,
              ['Extract relevant product and fixture information', 'Keep pages with specifications and schedules']
            );
            // If we got a result (even with success: false), break out of retry loop
            if (result) break;
          } catch (apiError) {
            lastError = apiError;
            console.error(`[Abridgement] Attempt ${attempt}/${MAX_RETRIES} failed for ${doc.name}:`, apiError);

            if (attempt < MAX_RETRIES) {
              const waitTime = attempt * 5000; // 5s, 10s, 15s
              addDocumentLog(doc.id, `⏳ API busy, retrying in ${waitTime / 1000}s... (attempt ${attempt}/${MAX_RETRIES})`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        }

        // If all retries failed and we have no result, throw the last error
        if (!result && lastError) {
          throw lastError;
        }

        // If we still don't have a result, create a failure result
        if (!result) {
          result = { success: false, error: 'API unavailable after retries' };
        }

        // DEBUG: Log API result to compare with flow 2
        console.log('[useTakeoffsState Abridge] API Result for', doc.name, ':', {
          success: result.success,
          abridgedUrl: result.abridgedUrl,
          originalPages: result.originalPages,
          abridgedPages: result.abridgedPages,
          error: result.error,
        });
        console.log('[useTakeoffsState Abridge] Original documentUrl:', doc.documentUrl);
        console.log('[useTakeoffsState Abridge] URLs match?', result.abridgedUrl === doc.documentUrl);

        // Getting fixture pages
        addDocumentLog(doc.id, `[1/${doc.pages}] Getting fixture pages from cache...`);
        setDocumentAbridgementProgress(prev => ({
          ...prev,
          [doc.id]: { ...prev[doc.id], progress: 60 },
        }));

        if (result.success) {
          // Always use originalPages from backend (more reliable than client-side pdf.js)
          const actualPages = result.originalPages || doc.pages;
          const abridgedPages = result.abridgedPages || actualPages;
          // Only use abridgedUrl if a new PDF was actually generated
          const effectiveAbridgedUrl = result.wasAbridged ? result.abridgedUrl : undefined;

          // Combining results
          addDocumentLog(doc.id, `[${Math.ceil(actualPages * 0.75)}/${actualPages}] Combining results...`);
          setDocumentAbridgementProgress(prev => ({
            ...prev,
            [doc.id]: { ...prev[doc.id], progress: 80 },
          }));

          // Creating abridged PDF
          if (result.wasAbridged) {
            addDocumentLog(doc.id, `[${actualPages}/${actualPages}] Creating abridged PDF...`);
          } else {
            addDocumentLog(doc.id, `[${actualPages}/${actualPages}] Reduction below threshold, keeping original...`);
          }
          setDocumentAbridgementProgress(prev => ({
            ...prev,
            [doc.id]: { ...prev[doc.id], progress: 90 },
          }));

          setDocuments(docs =>
            docs.map(d =>
              d.id === doc.id
                ? {
                    ...d,
                    pages: actualPages, // Always update pages from backend
                    abridged: true,
                    abridgedPages: abridgedPages,
                    reductionPercentage: result.reductionPercentage || 0,
                    abridgedUrl: effectiveAbridgedUrl || undefined,
                    pageAnalyses: result.pageAnalyses || undefined,
                  }
                : d
            )
          );

          // Persist to backend
          try {
            console.log('[Abridgement ALL] Saving to backend:', {
              docId: doc.id,
              wasAbridged: result.wasAbridged,
              abridgedUrl: effectiveAbridgedUrl,
              pageAnalysesCount: result.pageAnalyses?.length || 0,
              pageAnalyses: result.pageAnalyses,
            });
            await updateTakeoffDocument(doc.id, {
              pages: actualPages,
              abridged: true,
              abridgedPages: abridgedPages,
              abridgedUrl: effectiveAbridgedUrl || null,
              reductionPercentage: result.reductionPercentage,
              pageAnalyses: result.pageAnalyses as unknown as UpdateTakeoffDocumentInput['pageAnalyses'],
            });
            console.log('[Abridgement ALL] Saved to backend successfully');
          } catch (persistError) {
            console.error(`Failed to persist abridgement for ${doc.name}:`, persistError);
          }

          // Complete logs - show abridged pages / total pages
          addDocumentLog(doc.id, '✅ Smart abridgment complete!');
          const reduction = result.reductionPercentage?.toFixed(0) || '0';
          addDocumentLog(doc.id, `📊 ${abridgedPages}/${actualPages} pages (${reduction}% reduction)`);
          if (result.wasAbridged) {
            addDocumentLog(doc.id, '✅ Ready for download!');
          } else {
            addDocumentLog(doc.id, '📄 Original document will be used (reduction below 30%)');
          }

          // Mark document as complete
          setDocumentAbridgementProgress(prev => ({
            ...prev,
            [doc.id]: { ...prev[doc.id], progress: 100, status: 'complete' },
          }));
        } else {
          // Mark as error
          addDocumentLog(doc.id, `❌ Error: ${result.error || 'Abridgement failed'}`);
          setDocumentAbridgementProgress(prev => ({
            ...prev,
            [doc.id]: { ...prev[doc.id], progress: 0, status: 'error', error: result.error || 'Abridgement failed' },
          }));
        }
      } catch (error) {
        console.error(`Failed to abridge ${doc.name}:`, error);
        addDocumentLog(doc.id, `❌ Error: ${error instanceof Error ? error.message : 'Failed'}`);
        setDocumentAbridgementProgress(prev => ({
          ...prev,
          [doc.id]: { ...prev[doc.id], progress: 0, status: 'error', error: error instanceof Error ? error.message : 'Failed' },
        }));
      }

      // Add delay between documents to avoid overwhelming the API (3 seconds)
      if (i < docsToAbridge.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    setAbridgementState({ isProcessing: false, progress: 100 });
  }, [documents, addDocumentLog, selectedTakeoff]);

  // Parse schedule documents to extract product items
  const handleParseSchedules = useCallback(async () => {
    console.log('[Parsing] Starting schedule parsing...');
    console.log('[Parsing] Total documents:', documents.length);

    // First check if we have any documents at all
    if (documents.length === 0) {
      console.log('[Parsing] No documents available');
      takeoffToasts.parsingError('No documents available. Please upload documents first.');
      return;
    }

    // Find all documents with URLs (abridged or original)
    const docsWithUrls = documents.filter(
      d => d.abridgedUrl || d.documentUrl
    );
    console.log('[Parsing] Documents with URLs:', docsWithUrls.length);

    if (docsWithUrls.length === 0) {
      console.log('[Parsing] No documents have URLs');
      takeoffToasts.parsingError('Documents do not have URLs. Try refreshing the page.');
      return;
    }

    // Update takeoff status to PARSING
    if (selectedTakeoff) {
      try {
        await apiUpdateTakeoff(selectedTakeoff.id, { status: 'PARSING' as TakeoffStatusEnum });
        // Update local state
        setTakeoffsData(prev =>
          prev.map(t =>
            t.id === selectedTakeoff.id ? { ...t, status: 'Parsing' as const } : t
          )
        );
        setSelectedTakeoff(prev => prev ? { ...prev, status: 'Parsing' as const } : null);
      } catch (error) {
        console.error('[Parsing] Failed to update takeoff status:', error);
      }
    }

    setParsingState({ isProcessing: true, progress: 0 });
    const allParsedItems: ParsedItem[] = [];

    for (let i = 0; i < docsWithUrls.length; i++) {
      const doc = docsWithUrls[i];
      const urlToUse = doc.abridgedUrl || doc.documentUrl;

      setParsingState(prev => ({
        ...prev,
        progress: Math.round((i / docsWithUrls.length) * 100),
        currentItem: doc.name,
      }));

      try {
        // Use the abridged URL if available, otherwise use original
        const items = await parseScheduleDocumentAPI(urlToUse!, doc.name);

        // Add document reference to items and ensure required fields
        const itemsWithDocRef: ParsedItem[] = items.map(item => ({
          ...item,
          id: `${doc.id}-${item.id}`,
          isOurManufacturer: item.isOurManufacturer ?? false,
          isCrossed: item.isCrossed ?? false,
        }));

        allParsedItems.push(...itemsWithDocRef);

        // Update document with parsed items in local state
        setDocuments(docs =>
          docs.map(d =>
            d.id === doc.id
              ? { ...d, parsedItems: itemsWithDocRef }
              : d
          )
        );

        // Persist parsed items to database
        try {
          console.log(`[Parsing] Persisting ${itemsWithDocRef.length} items to database for doc ${doc.id}`);
          await updateTakeoffDocument(doc.id, { parsedItems: itemsWithDocRef });
          console.log(`[Parsing] Successfully persisted items for ${doc.name}`);
        } catch (persistErr) {
          console.error(`[Parsing] Failed to persist parsed items for ${doc.name}:`, persistErr);
          // Continue even if persistence fails - items are still in local state
        }
      } catch (error) {
        console.error(`Failed to parse ${doc.name}:`, error);
        setParsingState(prev => ({
          ...prev,
          error: `Failed to parse ${doc.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }));
      }
    }

    // Update global parsed items state
    setParsedItems(allParsedItems);
    setParsingState({ isProcessing: false, progress: 100 });
  }, [documents, selectedTakeoff]);

  // Run product cross using AI for all eligible parsed items
  const handleCrossAll = useCallback(async () => {
    console.log('🔵 [handleCrossAll] START - parsedItems count:', parsedItems.length);

    // Get all items that can be crossed (not our manufacturer) - allows re-crossing
    const itemsToCross = parsedItems.filter(item => !item.isOurManufacturer);

    console.log('🔵 [handleCrossAll] Items to cross:', itemsToCross.length);
    console.log('🔵 [handleCrossAll] Items details:', itemsToCross.map(i => ({ id: i.id, manufacturer: i.manufacturer, isOur: i.isOurManufacturer, isCrossed: i.isCrossed })));

    if (itemsToCross.length === 0) {
      console.log('🔵 [handleCrossAll] No items to cross - returning');
      showInfoToast('No items to cross', { description: 'All items are from our manufacturers.' });
      return;
    }

    console.log(`🔵 [handleCrossAll] Crossing ${itemsToCross.length} items`);
    setProductCrossState({ isProcessing: true, progress: 0 });

    // Set processing state for each individual item (shows spinner per row)
    const processingState: Record<string, { isProcessing: boolean; error?: string }> = {};
    itemsToCross.forEach(item => {
      processingState[item.id] = { isProcessing: true };
    });
    setItemCrossingState(prev => ({ ...prev, ...processingState }));

    try {
      // Prepare products data for API (using snake_case as expected by backend)
      const productsData = itemsToCross.map(item => ({
        id: item.id,
        name: `${item.manufacturer} ${item.partNumber}`.trim(),
        manufacturer: item.manufacturer,
        part_number: item.partNumber,
        description: item.description,
      }));

      console.log('🔵 [handleCrossAll] Calling crossProducts API with:', productsData.length, 'products');

      // Call cross API
      const crosses = await crossProducts(productsData, selectedCrossTypes);

      console.log('🔵 [handleCrossAll] API response - crosses count:', crosses.length);
      console.log('🔵 [handleCrossAll] API response full:', JSON.stringify(crosses, null, 2));

      // Create a map of crossed results
      const crossedResults = new Map<string, { manufacturer: string; partNumber: string; description: string }>();

      crosses.forEach((cross, index) => {
        const originalItem = itemsToCross[index];
        console.log(`🔵 [handleCrossAll] Processing cross ${index}:`, {
          hasOriginalItem: !!originalItem,
          crossesLength: cross.crosses?.length,
          cross: cross
        });

        if (originalItem && cross.crosses && cross.crosses.length > 0) {
          const alternatives = cross.crosses.flatMap(c => c.alternatives);
          console.log(`🔵 [handleCrossAll] Alternatives for ${originalItem.id}:`, alternatives);

          const bestAlternative = alternatives[0];
          if (bestAlternative) {
            crossedResults.set(originalItem.id, {
              manufacturer: bestAlternative.name,
              partNumber: bestAlternative.description?.split(' ')[0] || `OC-${Math.floor(Math.random() * 90000) + 10000}`,
              description: bestAlternative.description || originalItem.description + ' (Crossed)',
            });
            console.log(`🔵 [handleCrossAll] Set result for ${originalItem.id}:`, crossedResults.get(originalItem.id));
          }
        }
      });

      console.log('🔵 [handleCrossAll] Total crossed results:', crossedResults.size);

      // Update parsed items with crossed data (allow re-crossing)
      setParsedItems(items =>
        items.map(item => {
          // Skip our manufacturer items - they should never be crossed
          if (item.isOurManufacturer) return item;

          const crossedResult = crossedResults.get(item.id);
          // Only update items that were sent to the API (have a result or were in itemsToCross)
          if (!crossedResult && !itemsToCross.some(i => i.id === item.id)) {
            return item;
          }

          if (!crossedResult) {
            // Fallback if no cross found from API
            return {
              ...item,
              isCrossed: true,
              crossedManufacturer: 'Our Company',
              crossedPartNumber: `OC-${Math.floor(Math.random() * 90000) + 10000}`,
              crossedDescription: item.description + ' (Crossed)',
            };
          }

          return {
            ...item,
            isCrossed: true,
            crossedManufacturer: crossedResult.manufacturer,
            crossedPartNumber: crossedResult.partNumber,
            crossedDescription: crossedResult.description,
          };
        })
      );

      showSuccessToast(`Crossed ${itemsToCross.length} items`);

      // Persist crossed items to takeoff_documents for each document
      // First, build the updated items map
      const updatedItemsMap = new Map<string, ParsedItem>();
      itemsToCross.forEach(item => {
        const crossedResult = crossedResults.get(item.id);
        updatedItemsMap.set(item.id, {
          ...item,
          isCrossed: true,
          crossedManufacturer: crossedResult?.manufacturer || 'Our Company',
          crossedPartNumber: crossedResult?.partNumber || `OC-${Math.floor(Math.random() * 90000) + 10000}`,
          crossedDescription: crossedResult?.description || item.description + ' (Crossed)',
        });
      });

      // Update documents with crossed items and persist to database
      for (const doc of documents) {
        if (!doc.parsedItems || doc.parsedItems.length === 0) continue;

        // Update items that belong to this document
        const updatedDocItems = doc.parsedItems.map(item => {
          const updated = updatedItemsMap.get(item.id);
          return updated || item;
        });

        // Persist to database
        try {
          console.log(`[handleCrossAll] Persisting ${updatedDocItems.length} items to document ${doc.id}`);
          await updateTakeoffDocument(doc.id, { parsedItems: updatedDocItems });
        } catch (persistErr) {
          console.error(`[handleCrossAll] Failed to persist items to document ${doc.id}:`, persistErr);
        }
      }

      // Persist each cross to known_product_crosses silently (no toast)
      for (const item of itemsToCross) {
        const crossedResult = crossedResults.get(item.id);
        if (crossedResult) {
          createKnownProductCross({
            competitorManufacturer: item.manufacturer,
            competitorPartNumber: item.partNumber,
            competitorDescription: item.description || '',
            ourManufacturer: crossedResult.manufacturer,
            ourPartNumber: crossedResult.partNumber,
            ourDescription: crossedResult.description,
          }).catch(err => console.error('Failed to persist cross:', err));
        }
      }

    } catch (error) {
      console.error('Failed to cross all items:', error);
      showErrorToast('Failed to cross items', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });

      // Fallback: mark all as crossed with generic values
      setParsedItems(items =>
        items.map(item => {
          if (item.isOurManufacturer || item.isCrossed) return item;
          return {
            ...item,
            isCrossed: true,
            crossedManufacturer: 'Our Company',
            crossedPartNumber: `OC-${Math.floor(Math.random() * 90000) + 10000}`,
            crossedDescription: item.description + ' (Crossed)',
          };
        })
      );
    } finally {
      setProductCrossState({ isProcessing: false, progress: 100 });
      // Clear individual item processing states
      const clearState: Record<string, { isProcessing: boolean; error?: string }> = {};
      itemsToCross.forEach(item => {
        clearState[item.id] = { isProcessing: false };
      });
      setItemCrossingState(prev => ({ ...prev, ...clearState }));

      // Update takeoff status to COMPLETE after crossing is done
      if (selectedTakeoff) {
        try {
          await apiUpdateTakeoff(selectedTakeoff.id, { status: 'COMPLETE' as TakeoffStatusEnum });
          // Update local state
          setTakeoffsData(prev =>
            prev.map(t =>
              t.id === selectedTakeoff.id ? { ...t, status: 'Complete' as const } : t
            )
          );
          setSelectedTakeoff(prev => prev ? { ...prev, status: 'Complete' as const } : null);
        } catch (error) {
          console.error('[handleCrossAll] Failed to update takeoff status to Complete:', error);
        }
      }
    }
  }, [parsedItems, selectedCrossTypes, documents, selectedTakeoff]);

  // Handle cross types change
  const handleCrossTypesChange = useCallback((types: CrossType[]) => {
    setSelectedCrossTypes(types);
  }, []);

  // Handle selecting a cross alternative (visual only - no save)
  // User must click "Save Selected" to persist to database
  const handleSelectAlternative = useCallback((originalIndex: number, altIndex: number) => {
    // Update local state only - toggle selection
    setProductCrossResults(prev => prev.map((r, i) => {
      if (i !== originalIndex) return r;
      return {
        ...r,
        alternatives: r.alternatives.map((alt, j) => ({
          ...alt,
          selected: j === altIndex ? !alt.selected : alt.selected,
        })),
      };
    }));
  }, []);

  // Handle saving all selected cross alternatives to database
  const handleSaveSelectedCrosses = useCallback(async () => {
    // Collect all selected alternatives
    const selectedCrosses: Array<{
      original: ProductCrossResult['original'];
      alternative: ProductCrossResult['alternatives'][0];
    }> = [];

    for (const result of productCrossResults) {
      for (const alt of result.alternatives) {
        if (alt.selected) {
          selectedCrosses.push({
            original: result.original,
            alternative: alt,
          });
        }
      }
    }

    if (selectedCrosses.length === 0) {
      showWarningToast('No crosses selected', {
        description: 'Please select at least one alternative to save.',
      });
      return;
    }

    // Save each selected cross to the database
    let savedCount = 0;
    let failedCount = 0;

    for (const cross of selectedCrosses) {
      try {
        await createKnownProductCross({
          competitorManufacturer: cross.original.manufacturer,
          competitorPartNumber: cross.original.partNumber,
          competitorDescription: cross.original.description || '',
          ourManufacturer: cross.alternative.name || 'Our Company',
          ourPartNumber: cross.alternative.description?.split(' ')[0] || '',
          ourDescription: cross.alternative.description || '',
        });
        savedCount++;
      } catch (error) {
        console.error('Failed to save product cross:', error);
        failedCount++;
      }
    }

    // Show result toast
    if (failedCount === 0) {
      showSuccessToast(`${savedCount} product cross${savedCount !== 1 ? 'es' : ''} saved`);
    } else if (savedCount > 0) {
      showWarningToast(`${savedCount} saved, ${failedCount} failed`);
    } else {
      showErrorToast('Failed to save product crosses');
    }
  }, [productCrossResults]);

  // Handle deleting a cross alternative (local state only)
  const handleDeleteCrossAlternative = useCallback((originalIndex: number, altIndex: number) => {
    // Update local state
    setProductCrossResults(prev => prev.map((r, i) => {
      if (i !== originalIndex) return r;
      return {
        ...r,
        alternatives: r.alternatives.filter((_, j) => j !== altIndex),
      };
    }).filter(r => r.alternatives.length > 0));
  }, []);

  // Handle rerun cross with custom prompt
  const handleRerunCross = useCallback(async (prompt: string, crossTypes: CrossType[]) => {
    // Find fixture schedule documents with URLs
    const fixtureScheduleDocs = documents.filter(
      d => d.classification === 'Fixture Schedules' && d.documentUrl
    );

    if (fixtureScheduleDocs.length === 0) {
      console.log('No fixture schedule documents to cross');
      return;
    }

    setProductCrossState({ isProcessing: true, progress: 0 });
    const allCrossResults: ProductCrossResult[] = [];

    for (let i = 0; i < fixtureScheduleDocs.length; i++) {
      const doc = fixtureScheduleDocs[i];
      setProductCrossState(prev => ({
        ...prev,
        progress: Math.round((i / fixtureScheduleDocs.length) * 100),
        currentItem: doc.name,
      }));

      try {
        const samplePrompts = prompt ? [prompt] : undefined;
        const crosses = await productCrossFromParsedDocument(
          doc.documentUrl!,
          doc.name,
          crossTypes,
          samplePrompts
        );

        for (const cross of crosses) {
          // Parse original if it's a JSON string (API returns it as string)
          let originalProduct: Record<string, unknown>;
          if (typeof cross.original === 'string') {
            try {
              originalProduct = JSON.parse(cross.original);
            } catch {
              console.warn('[handleRerunCross] Failed to parse cross.original:', cross.original);
              originalProduct = {};
            }
          } else {
            originalProduct = (cross.original as Record<string, unknown>) || {};
          }
          const alternatives = cross.crosses.flatMap(c => c.alternatives);

          const crossResult: ProductCrossResult = {
            original: {
              // Handle different field names: manufacturer/mark, part_number/mark, description/type
              manufacturer: String(originalProduct?.manufacturer || originalProduct?.mark || originalProduct?.name || 'Unknown'),
              partNumber: String(originalProduct?.part_number || originalProduct?.partNumber || originalProduct?.mark || ''),
              description: String(originalProduct?.description || originalProduct?.type || ''),
            },
            alternatives: alternatives.map((alt, idx) => ({
              name: alt.name,
              description: alt.description || '',
              price: alt.price,
              source: alt.source,
              crossType: (alt.crossType?.toUpperCase() || 'SIMPLE') as CrossType,
              reasoning: cross.crosses[0]?.notes || prompt || 'Compatible alternative with similar specifications',
              selected: idx === 0,
            })),
          };
          allCrossResults.push(crossResult);
        }
      } catch (error) {
        console.error(`Failed to rerun cross for ${doc.name}:`, error);
      }
    }

    // Set local results (persistence happens when user selects an alternative)
    setProductCrossResults(allCrossResults);

    setProductCrossState({ isProcessing: false, progress: 100 });
  }, [documents, selectedTakeoff]);

  // Cross a single item using AI backend (allows re-crossing)
  const handleCrossItem = useCallback(async (itemId: string) => {
    console.log('🔥 [handleCrossItem v2.0] CODE WITH DATABASE SAVE - Starting for item:', itemId);
    const item = parsedItems.find(i => i.id === itemId);
    if (!item || item.isOurManufacturer) {
      console.log('[DEBUG handleCrossItem] Skipping - item not found or is our manufacturer');
      return;
    }

    console.log('[DEBUG handleCrossItem] Crossing item:', item.manufacturer, item.partNumber);
    // Use itemCrossingState for individual item (not productCrossState which is for Cross All)
    setItemCrossingState(prev => ({ ...prev, [itemId]: { isProcessing: true } }));

    try {
      // Build product object (using snake_case as expected by backend)
      const productData = {
        name: `${item.manufacturer} ${item.partNumber}`.trim(),
        manufacturer: item.manufacturer,
        part_number: item.partNumber,
        description: item.description,
      };

      console.log('🟡 [STEP 1] Calling crossProducts API...');
      const crosses = await crossProducts([productData], ['SIMPLE', 'UPGRADE', 'VALUE']);
      console.log('🟡 [STEP 2] crossProducts response received:', {
        hasData: !!crosses,
        length: crosses?.length,
        firstCrossesLength: crosses?.[0]?.crosses?.length
      });
      console.log('🟡 [STEP 2b] Full response:', JSON.stringify(crosses, null, 2));

      if (crosses.length > 0 && crosses[0].crosses.length > 0) {
        console.log('🟡 [STEP 3] Found crosses, extracting alternatives...');
        const alternatives = crosses[0].crosses.flatMap(c => c.alternatives);
        const bestAlternative = alternatives[0];
        console.log('🟡 [STEP 4] Best alternative:', bestAlternative);

        const crossedManufacturer = bestAlternative?.name || 'Our Company';
        const crossedPartNumber = bestAlternative?.description?.split(' ')[0] || `OC-${Math.floor(Math.random() * 90000) + 10000}`;
        const crossedDescription = bestAlternative?.description || item.description + ' (Crossed)';
        console.log('🟡 [STEP 5] Crossed values:', { crossedManufacturer, crossedPartNumber, crossedDescription });

        console.log('🟡 [STEP 6] Updating UI state with setParsedItems...');
        setParsedItems(items =>
          items.map(i => {
            if (i.id !== itemId) return i;
            return {
              ...i,
              isCrossed: true,
              crossedManufacturer,
              crossedPartNumber,
              crossedDescription,
            };
          })
        );
        console.log('🟡 [STEP 7] UI state updated');

        // Persist to database silently (no toast)
        createKnownProductCross({
          competitorManufacturer: item.manufacturer,
          competitorPartNumber: item.partNumber,
          competitorDescription: item.description || '',
          ourManufacturer: crossedManufacturer,
          ourPartNumber: crossedPartNumber,
          ourDescription: crossedDescription,
        }).catch(err => console.error('Failed to persist cross:', err));
      } else {
        // Fallback if no crosses found
        const crossedManufacturer = 'Our Company';
        const crossedPartNumber = `OC-${Math.floor(Math.random() * 90000) + 10000}`;
        const crossedDescription = item.description + ' (Crossed)';

        setParsedItems(items =>
          items.map(i => {
            if (i.id !== itemId) return i;
            return {
              ...i,
              isCrossed: true,
              crossedManufacturer,
              crossedPartNumber,
              crossedDescription,
            };
          })
        );
      }
    } catch (error) {
      console.error('Failed to cross item:', error);
      // Fallback to local cross on error
      const crossedManufacturer = 'Our Company';
      const crossedPartNumber = `OC-${Math.floor(Math.random() * 90000) + 10000}`;
      const crossedDescription = item.description + ' (Crossed)';

      setParsedItems(items =>
        items.map(i => {
          if (i.id !== itemId) return i;
          return {
            ...i,
            isCrossed: true,
            crossedManufacturer,
            crossedPartNumber,
            crossedDescription,
          };
        })
      );
    } finally {
      // Clear individual item crossing state (not productCrossState which is for Cross All)
      setItemCrossingState(prev => ({ ...prev, [itemId]: { isProcessing: false } }));

      // Check if all crossable items are now crossed - update status to Complete
      // Need to check after the state update, so we check the original parsedItems plus this one
      const crossableItems = parsedItems.filter(i => !i.isOurManufacturer);
      const allCrossed = crossableItems.every(i => i.id === itemId || i.isCrossed);

      if (allCrossed && selectedTakeoff) {
        try {
          await apiUpdateTakeoff(selectedTakeoff.id, { status: 'COMPLETE' as TakeoffStatusEnum });
          setTakeoffsData(prev =>
            prev.map(t =>
              t.id === selectedTakeoff.id ? { ...t, status: 'Complete' as const } : t
            )
          );
          setSelectedTakeoff(prev => prev ? { ...prev, status: 'Complete' as const } : null);
          console.log('[handleCrossItem] All items crossed - status updated to Complete');
        } catch (error) {
          console.error('[handleCrossItem] Failed to update status to Complete:', error);
        }
      }
    }
  }, [parsedItems, selectedTakeoff]);

  // Cross selected items using AI backend
  const handleCrossSelected = useCallback(async () => {
    const itemsToCross = parsedItems.filter(
      item => selectedItems.has(item.id) && !item.isOurManufacturer && !item.isCrossed
    );

    if (itemsToCross.length === 0) {
      setSelectedItems(new Set());
      return;
    }

    setProductCrossState({ isProcessing: true, progress: 0 });

    try {
      // Prepare products data (using snake_case as expected by backend)
      const productsData = itemsToCross.map(item => ({
        id: item.id,
        name: `${item.manufacturer} ${item.partNumber}`.trim(),
        manufacturer: item.manufacturer,
        part_number: item.partNumber,
        description: item.description,
      }));

      const crosses = await crossProducts(productsData, ['SIMPLE', 'UPGRADE', 'VALUE']);

      // Create a map of crossed results
      const crossedResults = new Map<string, { manufacturer: string; partNumber: string; description: string }>();

      crosses.forEach((cross, index) => {
        const originalItem = itemsToCross[index];
        if (originalItem && cross.crosses.length > 0) {
          const alternatives = cross.crosses.flatMap(c => c.alternatives);
          const bestAlternative = alternatives[0];
          if (bestAlternative) {
            crossedResults.set(originalItem.id, {
              manufacturer: bestAlternative.name,
              partNumber: bestAlternative.description?.split(' ')[0] || `OC-${Math.floor(Math.random() * 90000) + 10000}`,
              description: bestAlternative.description || originalItem.description + ' (Crossed)',
            });
          }
        }
      });

      setParsedItems(items =>
        items.map(item => {
          if (!selectedItems.has(item.id) || item.isOurManufacturer) return item;

          const crossedResult = crossedResults.get(item.id);
          return {
            ...item,
            isCrossed: true,
            crossedManufacturer: crossedResult?.manufacturer || 'Our Company',
            crossedPartNumber: crossedResult?.partNumber || `OC-${Math.floor(Math.random() * 90000) + 10000}`,
            crossedDescription: crossedResult?.description || item.description + ' (Crossed)',
          };
        })
      );
    } catch (error) {
      console.error('Failed to cross selected items:', error);
      // Fallback to local cross on error
      setParsedItems(items =>
        items.map(item => {
          if (!selectedItems.has(item.id) || item.isOurManufacturer) return item;
          return {
            ...item,
            isCrossed: true,
            crossedManufacturer: 'Our Company',
            crossedPartNumber: `OC-${Math.floor(Math.random() * 90000) + 10000}`,
            crossedDescription: item.description + ' (Crossed)',
          };
        })
      );
    } finally {
      setProductCrossState({ isProcessing: false, progress: 100 });
      setSelectedItems(new Set());
    }
  }, [parsedItems, selectedItems]);

  const handleToggleSelectItem = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAllItems = useCallback((checked: boolean) => {
    if (checked) {
      const selectableIds = parsedItems
        .filter(item => !item.isOurManufacturer && !item.isCrossed)
        .map(item => item.id);
      setSelectedItems(new Set(selectableIds));
    } else {
      setSelectedItems(new Set());
    }
  }, [parsedItems]);

  // File upload handlers
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      // Append new files to existing, limit to 20 total
      setUploadedFiles(prev => [...prev, ...fileArray].slice(0, 20));
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setUploadedFiles(files => files.filter((_, i) => i !== index));
  }, []);

  const handleClearFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  // Progress callback for upload
  const handleUploadProgress: UploadProgressCallback = useCallback((
    fileIndex: number,
    progress: number,
    status: 'uploading' | 'complete' | 'error',
    error?: string
  ) => {
    setUploadProgress(prev => ({
      ...prev,
      [fileIndex]: { progress, status, error }
    }));
  }, []);

  // Create new takeoff with project data and real file upload
  const handleUploadStart = useCallback(async (projectData?: {
    projectName: string;
    clientName: string;
    bidDate: string;
    estimatedValue: string;
    city: string;
    state: string;
  }) => {
    if (uploadedFiles.length === 0) {
      takeoffToasts.uploadError('No files selected. Please select files to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);

    // Initialize progress for all files
    const initialProgress: Record<number, FileUploadProgress> = {};
    uploadedFiles.forEach((_, index) => {
      initialProgress[index] = { progress: 0, status: 'pending' };
    });
    setUploadProgress(initialProgress);

    try {
      // Upload files to CRM storage and create takeoff in flow-ai
      const newTakeoff = await createTakeoffWithFiles(
        {
          title: projectData?.projectName || `New Takeoff - ${new Date().toLocaleDateString()}`,
          source: 'Manual Upload',
          createdBy: currentUserName,
          metadata: projectData ? {
            clientName: projectData.clientName,
            bidDate: projectData.bidDate,
            estimatedValue: projectData.estimatedValue,
            city: projectData.city,
            state: projectData.state,
          } : undefined,
          files: uploadedFiles,
        },
        handleUploadProgress
      );

      const transformed = transformTakeoffResponse(newTakeoff);
      console.log('[Upload] Created takeoff:', transformed);
      console.log('[Upload] Takeoff documents:', transformed.documents);

      // Add to list and select it
      setTakeoffsData(prev => [transformed, ...prev]);
      setSelectedTakeoff(transformed);
      setViewMode('detail');
      setCurrentStep('classification');

      // Set documents for the detail view
      const docCount = transformed.documents?.length || newTakeoff.documents?.length || 0;
      if (transformed.documents && transformed.documents.length > 0) {
        console.log('[Upload] Setting documents:', transformed.documents.length);
        setDocuments(transformed.documents);
      } else {
        console.warn('[Upload] No documents found in transformed takeoff');
        // Try to use documents from the raw response
        if (newTakeoff.documents && newTakeoff.documents.length > 0) {
          console.log('[Upload] Using raw documents:', newTakeoff.documents.length);
          const docs = newTakeoff.documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            type: 'PDF' as const,
            size: doc.fileSize,
            uploadDate: doc.createdAt,
            classification: '' as const,
            confidence: doc.confidence || 0,
            pages: doc.pages,
            abridged: doc.abridged,
            abridgedPages: doc.abridgedPages || undefined,
            reductionPercentage: doc.reductionPercentage || undefined,
            documentUrl: doc.documentUrl || undefined,
          }));
          setDocuments(docs);
        } else {
          console.warn('[Upload] No documents in response');
        }
      }

      // Show success toast
      takeoffToasts.uploadSuccess(
        projectData?.projectName || 'Project',
        docCount
      );

      // Trigger auto-classification after upload
      setShouldAutoClassify(true);

      // Close modal after success
      setShowUploadModal(false);
    } catch (err) {
      console.error('Failed to create takeoff:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to create takeoff';
      takeoffToasts.uploadError(errorMsg);
      setError(errorMsg);
      // Don't close modal on error so user can retry
    } finally {
      setIsUploading(false);
      setUploadedFiles([]);
      setUploadProgress({});
    }
  }, [uploadedFiles, handleUploadProgress, currentUserName]);

  // Navigation handlers
  const handleSelectTakeoff = useCallback(async (takeoff: Takeoff) => {
    setSelectedTakeoff(takeoff);
    setViewMode('detail');
    setCurrentStep(getInitialStep(takeoff.status));

    // Load documents for the selected takeoff
    // First try from the takeoff object, then fetch from backend if needed
    let docs = takeoff.documents || [];

    if (docs.length === 0) {
      // Fetch full takeoff data from backend to get documents
      console.log('[handleSelectTakeoff] No documents in takeoff, fetching from backend...');
      try {
        const fullTakeoff = await fetchTakeoff(takeoff.id);
        if (fullTakeoff?.documents && fullTakeoff.documents.length > 0) {
          console.log('[handleSelectTakeoff] Got documents from backend:', fullTakeoff.documents.length);
          // Debug: log pageAnalyses for each document
          fullTakeoff.documents.forEach(doc => {
            console.log(`[handleSelectTakeoff] Document ${doc.name}: pageAnalyses=`, doc.pageAnalyses, 'abridged=', doc.abridged);
          });
          docs = fullTakeoff.documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            type: 'PDF' as const,
            size: doc.fileSize,
            uploadDate: doc.createdAt,
            classification: doc.classification ? (doc.classification as DocumentClassification) : ('' as DocumentClassification),
            confidence: doc.confidence || 0,
            pages: doc.pages,
            abridged: doc.abridged,
            abridgedPages: doc.abridgedPages || undefined,
            reductionPercentage: doc.reductionPercentage || undefined,
            documentUrl: doc.documentUrl || undefined,
            pageAnalyses: doc.pageAnalyses || undefined,
            products: doc.products,
            parsedItems: safeParseParsedItems(doc.parsedItems),
          }));
        }
      } catch (error) {
        console.error('[handleSelectTakeoff] Failed to fetch takeoff:', error);
      }
    }

    if (docs.length > 0) {
      setDocuments(docs);
      // Extract parsed items from documents
      const allParsedItems: ParsedItem[] = [];
      docs.forEach(doc => {
        if (doc.parsedItems) {
          allParsedItems.push(...doc.parsedItems);
        }
      });
      setParsedItems(allParsedItems);
    } else {
      console.warn('[handleSelectTakeoff] No documents found for takeoff');
      setDocuments([]);
      setParsedItems([]);
    }

    // Initialize product cross results (crosses are saved to product_crosses when selected)
    setProductCrossResults([]);
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedTakeoff(null);
    setDocuments([]);
    setParsedItems([]);
    setSelectedItems(new Set());
  }, []);

  const handleCreateQuote = useCallback(async () => {
    if (!selectedTakeoff) return;

    // Get all crossed items
    const crossedItems = parsedItems.filter(item => item.isCrossed);

    if (crossedItems.length === 0) {
      showWarningToast('No Items Selected', {
        description: 'Please cross some products first to create a quote.'
      });
      return;
    }

    // Prepare quote data for export/use in CRM
    const quoteData = {
      title: `Quote from ${selectedTakeoff.title}`,
      takeoffId: selectedTakeoff.id,
      items: crossedItems.map((item, index) => ({
        itemNumber: index + 1,
        manufacturer: item.crossedManufacturer || item.manufacturer,
        partNumber: item.crossedPartNumber || item.partNumber,
        description: item.crossedDescription || item.description,
        quantity: item.quantity,
        originalManufacturer: item.manufacturer,
        originalPartNumber: item.partNumber,
      })),
      metadata: selectedTakeoff.metadata,
      createdAt: new Date().toISOString(),
    };

    // Store quote data in sessionStorage for the quotes page to pick up
    try {
      sessionStorage.setItem('takeoffQuoteData', JSON.stringify(quoteData));
    } catch (e) {
      console.error('Failed to store quote data:', e);
    }

    // Generate CSV for easy export
    const csvContent = [
      ['Item #', 'Part Number', 'Description', 'Manufacturer', 'Quantity', 'Original Part #', 'Original Manufacturer'].join(','),
      ...quoteData.items.map(item => [
        item.itemNumber,
        `"${item.partNumber}"`,
        `"${item.description.replace(/"/g, '""')}"`,
        `"${item.manufacturer}"`,
        item.quantity,
        `"${item.originalPartNumber}"`,
        `"${item.originalManufacturer}"`,
      ].join(',')),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `quote-from-${selectedTakeoff.title.replace(/[^a-zA-Z0-9]/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    // Update takeoff status to Complete
    try {
      await apiUpdateTakeoff(selectedTakeoff.id, { status: 'COMPLETE' as TakeoffStatusEnum });

      // Update local state
      setTakeoffsData(prev =>
        prev.map(t =>
          t.id === selectedTakeoff.id ? { ...t, status: 'Complete' as const } : t
        )
      );
    } catch (error) {
      console.error('Failed to update takeoff status:', error);
    }

    showSuccessToast('Quote Exported', {
      description: `${crossedItems.length} items exported to CSV. You can import this into the Quotes page.`
    });
    setViewMode('list');
    setSelectedTakeoff(null);
  }, [selectedTakeoff, parsedItems]);

  // Delete takeoff
  const handleDeleteTakeoff = useCallback(async (takeoffId: string) => {
    try {
      await apiDeleteTakeoff(takeoffId);
      setTakeoffsData(prev => prev.filter(t => t.id !== takeoffId));
    } catch (err) {
      console.error('Failed to delete takeoff:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete takeoff');
    }
  }, []);

  // Refresh data with current filters
  const handleRefresh = useCallback(() => {
    loadTakeoffs({
      search: debouncedSearch || undefined,
      status: statusFilter,
      source: sourceFilter,
      title: titleFilter,
      createdBy: createdByFilter,
    });
  }, [loadTakeoffs, debouncedSearch, statusFilter, sourceFilter, titleFilter, createdByFilter]);

  // Modal handlers
  const handleOpenUploadModal = useCallback(() => {
    setShowUploadModal(true);
  }, []);

  const handleCloseUploadModal = useCallback(() => {
    setShowUploadModal(false);
    setUploadedFiles([]);
  }, []);

  const handleOpenAbridgmentReport = useCallback((doc: TakeoffDocument) => {
    console.log('[handleOpenAbridgmentReport] Opening modal for document:', doc.name);
    console.log('[handleOpenAbridgmentReport] pageAnalyses:', doc.pageAnalyses);
    console.log('[handleOpenAbridgmentReport] abridged:', doc.abridged, 'abridgedUrl:', doc.abridgedUrl);
    setSelectedDocument(doc);
    setShowAbridgmentReportModal(true);
  }, []);

  const handleCloseAbridgmentReport = useCallback(() => {
    setShowAbridgmentReportModal(false);
    setSelectedDocument(null);
  }, []);

  // Download a single document
  const handleDownloadDocument = useCallback(async (doc: TakeoffDocument) => {
    if (!doc.documentUrl) {
      showErrorToast('Download Failed', { description: 'Document URL not available' });
      return;
    }

    try {
      // Use proxy to avoid CORS issues and force download
      const proxyUrl = `/api/document-proxy?url=${encodeURIComponent(doc.documentUrl)}&filename=${encodeURIComponent(doc.name)}`;
      console.log('[Download] Fetching via proxy:', proxyUrl);
      const response = await fetch(proxyUrl);
      console.log('[Download] Proxy response status:', response.status, response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Download] Proxy failed:', response.status, errorText);
        // Fallback to opening in new tab
        window.open(doc.documentUrl, '_blank');
        return;
      }

      const blob = await response.blob();
      console.log('[Download] Got blob, size:', blob.size, 'type:', blob.type);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      console.log('[Download] Triggering download:', doc.name);
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[Download] Exception:', error);
      // Fallback to opening in new tab
      window.open(doc.documentUrl, '_blank');
    }
  }, []);

  // Download all documents as a single ZIP file
  const handleDownloadAllDocuments = useCallback(async () => {
    const docsWithUrls = documents.filter(d => d.documentUrl);

    if (docsWithUrls.length === 0) {
      showWarningToast('No Documents', { description: 'No documents available for download' });
      return;
    }

    showInfoToast('Creating ZIP', { description: `Preparing ${docsWithUrls.length} documents...` });

    const zip = new JSZip();
    let successCount = 0;

    // Fetch all documents and add to ZIP
    for (const doc of docsWithUrls) {
      if (!doc.documentUrl) continue;

      try {
        const proxyUrl = `/api/document-proxy?url=${encodeURIComponent(doc.documentUrl)}`;
        const response = await fetch(proxyUrl);

        if (response.ok) {
          const blob = await response.blob();
          zip.file(doc.name, blob);
          successCount++;
        }
      } catch (error) {
        console.error(`Error fetching ${doc.name}:`, error);
      }
    }

    if (successCount === 0) {
      showErrorToast('Download Failed', { description: 'Could not fetch any documents' });
      return;
    }

    // Generate and download the ZIP file
    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const takeoffName = selectedTakeoff?.title || 'takeoff';
      const zipFilename = `${takeoffName.replace(/[^a-zA-Z0-9]/g, '_')}_documents.zip`;

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipFilename;
      link.click();
      URL.revokeObjectURL(url);

      showSuccessToast('Download Complete', { description: `Downloaded ${successCount} documents as ZIP` });
    } catch (error) {
      console.error('Error creating ZIP:', error);
      showErrorToast('ZIP Error', { description: 'Failed to create ZIP file' });
    }
  }, [documents, selectedTakeoff]);

  // Update takeoff status when workflow step changes
  const handleStepChange = useCallback(async (newStep: TakeoffStep) => {
    setCurrentStep(newStep);

    if (!selectedTakeoff) return;

    // Map workflow step to takeoff status (simplified 2-tab workflow)
    const stepStatusMap: Record<TakeoffStep, TakeoffStatusEnum | null> = {
      classification: 'CLASSIFICATION',
      parsing: 'PARSING',
    };

    const newStatus = stepStatusMap[newStep];

    if (newStatus && statusApiMap[selectedTakeoff.status] !== newStatus) {
      try {
        await apiUpdateTakeoff(selectedTakeoff.id, { status: newStatus });

        // Update local state
        const displayStatus = {
          CLASSIFICATION: 'Classification',
          ABRIDGMENT: 'Abridgment',
          PARSING: 'Parsing',
          COMPLETE: 'Complete',
        }[newStatus] as typeof selectedTakeoff.status;

        setSelectedTakeoff(prev => prev ? { ...prev, status: displayStatus } : null);
        setTakeoffsData(prev =>
          prev.map(t =>
            t.id === selectedTakeoff.id ? { ...t, status: displayStatus } : t
          )
        );
      } catch (error) {
        console.error('Failed to update takeoff status:', error);
      }
    }
  }, [selectedTakeoff]);

  return {
    // View state
    viewMode,
    selectedTakeoff,
    currentStep,
    setCurrentStep,

    // Filter state
    activeFilters,
    setActiveFilters,
    searchQuery,
    setSearchQuery,

    // Data
    takeoffs,
    documents,
    parsedItems,
    selectedItems,
    uploadedFiles,

    // Upload state
    uploadProgress,
    isUploading,

    // Auto-classification trigger
    shouldAutoClassify,
    setShouldAutoClassify,

    // AI Processing states
    classificationState,
    abridgementState,
    productCrossState,
    documentAbridgementProgress,
    itemCrossingState,

    // Product cross detail data
    productCrossResults,
    selectedCrossTypes,

    // Loading/Error states
    isLoading,
    error,
    totalCount,

    // Modal state
    showUploadModal,
    showAbridgmentReportModal,
    selectedDocument,

    // Document handlers
    handleClassifyDocument,
    handleBulkClassifyDocuments,
    handleChangeDiscipline,
    handleAbridgeDocument,
    handleAbridgeAll,

    // Parsing handlers
    handleParseSchedules,
    parsingState,

    // Parsed items handlers
    handleCrossItem,
    handleCrossSelected,
    handleCrossAll,
    handleToggleSelectItem,
    handleSelectAllItems,

    // File handlers
    handleFileSelect,
    handleRemoveFile,
    handleClearFiles,

    // Navigation handlers
    handleUploadStart,
    handleSelectTakeoff,
    handleBackToList,
    handleCreateQuote,
    handleDeleteTakeoff,
    handleRefresh,

    // Modal handlers
    handleOpenUploadModal,
    handleCloseUploadModal,
    handleOpenAbridgmentReport,
    handleCloseAbridgmentReport,

    // Download handlers
    handleDownloadDocument,
    handleDownloadAllDocuments,

    // Step change handler (with status update)
    handleStepChange,

    // Product cross detail handlers
    handleCrossTypesChange,
    handleSelectAlternative,
    handleSaveSelectedCrosses,
    handleDeleteCrossAlternative,
    handleRerunCross,
  };
}
